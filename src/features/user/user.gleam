import app/ctx.{type Ctx}
import app/session
import app/web
import domains/auth_session/auth_session.{type AuthSession}
import domains/user/user.{type User}
import features/auth/auth
import features/user/forms.{type EditNameForm}
import features/user/ui
import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_account_page(req: Request, user: User) {
  ui.account_details(user)
  |> ui.account_page(req.path)
  |> web.send_html(200)
}

pub fn sign_out(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    auth_session.delete_by_id(ctx.db, auth_session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> session.clear_cookie(req, auth.auth_session_cookie().name)

    Error(err) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.sign_out_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}

pub fn view_rename_page(req: Request, user: User) {
  forms.get_edit_name_form()
  |> form.add_values([#("name", user.name)])
  |> ui.edit_name_form()
  |> ui.edit_name_page(req.path)
  |> web.send_html(200)
}

type RenameError {
  RenameValidation(Form(EditNameForm))
  RenameDatabaseFailure(QueryError)
}

pub fn rename(req: Request, user: User, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(RenameValidation),
    )

    use <- bool.guard(when: input.name == user.name, return: Ok(Nil))

    user.rename(ctx.db, input.name, user.id)
    |> result.map_error(RenameDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(RenameValidation(invalid_form)) ->
      invalid_form
      |> ui.edit_name_form()
      |> web.send_html(422)

    Error(RenameDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.edit_name_form()
      |> web.send_html(500)
    }
  }
}
