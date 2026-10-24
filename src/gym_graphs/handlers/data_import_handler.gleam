import gleam/dynamic.{type Dynamic}
import gleam/http/request
import gleam/option
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
import gym_graphs/services/import_data_service
import gym_graphs/views/user_view
import lustre/element
import wisp.{type Request, type UploadedFile}

type UploadError {
  InvalidUpload(String)
  AccountNotEmpty
  UploadFailure
}

pub fn upload(req: Request, user: User, ctx: Ctx) {
  let response =
    wisp.require_form(req, fn(formdata) {
      handle_form(req, formdata, user, ctx)
    })

  case response.status {
    400 ->
      import_error_response(req, "the upload could not be read", status: 400)
    413 ->
      import_error_response(req, "the selected file exceeds 5 MB", status: 413)
    415 ->
      import_error_response(req, "select a JSON file to import", status: 415)
    _ -> response
  }
}

fn handle_form(req: Request, formdata: wisp.FormData, user: User, ctx: Ctx) {
  let result = case formdata.files {
    [#("import_file", file)] -> import_file(file, user, ctx)
    _ -> Error(InvalidUpload("select one Gym Graphs JSON export"))
  }

  case result {
    Ok(Nil) ->
      case request.get_header(req, "hx-request") {
        Ok("true") ->
          wisp.created() |> wisp.set_header("HX-Redirect", "/account")
        _ -> wisp.redirect(to: "/account")
      }

    Error(InvalidUpload(message)) ->
      import_error_response(req, message, status: 422)

    Error(AccountNotEmpty) ->
      import_error_response(
        req,
        "your account already contains workout data",
        status: 409,
      )

    Error(UploadFailure) -> {
      wisp.log_error(req.path <> " importing data failed")
      import_error_response(req, "something went wrong", status: 500)
    }
  }
}

fn import_file(file: UploadedFile, user: User, ctx: Ctx) {
  case read_file(file.path) {
    Error(_) -> Error(UploadFailure)
    Ok(contents) ->
      case import_data_service.restore(contents, ctx.db, user.id) {
        Error(import_data_service.InvalidJson) ->
          Error(InvalidUpload("the selected file is not a valid export"))
        Error(import_data_service.UnsupportedVersion(version)) ->
          Error(InvalidUpload(
            "export version " <> string.inspect(version) <> " is not supported",
          ))
        Error(import_data_service.InvalidData(message)) ->
          Error(InvalidUpload(message))
        Error(import_data_service.AccountNotEmpty) -> Error(AccountNotEmpty)
        Error(import_data_service.ImportFailure) -> Error(UploadFailure)
        Ok(Nil) -> Ok(Nil)
      }
  }
}

@external(erlang, "file", "read_file")
fn read_file(path: String) -> Result(BitArray, Dynamic)

fn import_error_response(req: Request, message: String, status status: Int) {
  let content = user_view.import_data_row(option.Some(message))
  let content = case request.get_header(req, "hx-request") {
    Ok("true") -> content
    _ -> user_view.account_page(content, req.path)
  }

  content
  |> element.to_string()
  |> wisp.html_response(status)
  |> wisp.set_header("cache-control", "private, no-store")
  |> wisp.set_header("x-content-type-options", "nosniff")
}
