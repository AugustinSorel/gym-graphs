import app/crypto
import app/ctx.{type Ctx}
import app/session
import app/web
import domains/auth_session/auth_session.{type AuthSession}
import domains/password_update/password_update.{type PasswordUpdate}
import domains/user/user.{type User}
import features/auth/auth
import features/password_update/ui.{type VerifyPasswordForm}
import features/user/ui as user_ui
import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn start(req: Request, session: AuthSession, ctx: Ctx) {
  let result = {
    use #(id, secret) <- result.try({
      password_update.create(ctx.db, session.id)
    })

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/verify-password")
      |> session.set_cookie(
        req,
        auth.password_update_cookie().name,
        token,
        auth.password_update_cookie().max_age,
      )

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_ui.update_password_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}

pub fn view_verify_password_page(user: User) {
  ui.get_verify_password_form()
  |> form.add_values([#("email", user.email)])
  |> ui.verify_password_form()
  |> ui.verify_password_page()
  |> web.send_html(200)
}

type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordForm))
  VerifyPasswordDatabaseFailure(QueryError)
  CredentialsError
}

pub fn verify_password(
  req: Request,
  session: PasswordUpdate,
  user: User,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(VerifyPasswordValidation),
    )

    use db_user <- result.try(
      user.select_by_id(ctx.db, user.id)
      |> result.map_error(VerifyPasswordDatabaseFailure),
    )

    let is_password_correct =
      crypto.validate_user_password(db_user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(CredentialsError),
    )

    use Nil <- result.try(
      password_update.mark_session_as_verified(ctx.db, session.id)
      |> result.map_error(VerifyPasswordDatabaseFailure)
      |> result.replace(Nil),
    )

    Ok(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/set-new-password")

    Error(VerifyPasswordValidation(invalid_form)) ->
      invalid_form
      |> ui.verify_password_form()
      |> web.send_html(422)

    Error(CredentialsError) ->
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> ui.verify_password_form()
      |> web.send_html(422)

    Error(VerifyPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_password_form()
      |> web.send_html(500)
    }
  }
}
