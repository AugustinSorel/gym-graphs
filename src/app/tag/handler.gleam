import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/tag/tag
import app/tag/ui
import app/web
import formal/form.{type Form}
import gleam/result
import gleam/string
import pog
import wisp.{type Request, type Response}

pub fn view_new_tag_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- auth_session.require(req, ctx)

  ui.get_new_tag_form()
  |> ui.new_tag_form()
  |> ui.new_tag_page(req)
  |> web.html(200)
}

type CreateTagError {
  CreateTagValidation(Form(ui.NewTagForm))
  CreateTagFailed(db.DatabaseError)
}

pub fn create_tag(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(CreateTagValidation),
    )

    tag.create(ctx.db, user.id, input.name)
    |> result.map_error(CreateTagFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/tags")

    Error(CreateTagValidation(invalid_form)) ->
      invalid_form
      |> ui.new_tag_form()
      |> web.html(422)

    Error(CreateTagFailed(db.DatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: _,
      detail: _,
    )))) ->
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("tag name is already used"))
      |> ui.new_tag_form()
      |> web.html(422)

    Error(CreateTagFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_tag_form()
      |> web.html(500)
    }

    Error(CreateTagFailed(db.RowNotFound)) -> wisp.internal_server_error()
  }
}
