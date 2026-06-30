import app/auth_session/auth_session
import app/auth_session/ui
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/guards
import app/session
import app/user/user
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request, type Response}

pub fn view_sign_in_page(req: Request, ctx: Ctx) -> Response {
  use <- guards.require_blank(req, ctx)

  ui.get_sign_in_form()
  |> ui.sign_in_form()
  |> ui.sign_in_page()
  |> web.html(200)
}

type SignInError {
  SignInFormError(form.Form(ui.SignInForm))
  SelectingUserByEmailFailed(db.DatabaseError)
  CreatingUserFailed(db.DatabaseError)
  InvalidCredentials
}

pub fn sign_in(req: Request, ctx: Ctx) -> Response {
  use <- guards.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SignInFormError),
    )

    use user <- result.try(
      user.select_by_email(ctx.db, input.email)
      |> result.map_error(SelectingUserByEmailFailed),
    )

    let password_valid =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    use #(session, secret) <- result.try(
      auth_session.create(ctx.db, user.id)
      |> result.map_error(CreatingUserFailed),
    )

    Ok(session.encode_token(session.id, secret))
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.set_cookie(req, guards.cookie_name, token, guards.cookie_max_age())
    }

    Error(SignInFormError(form)) ->
      form
      |> ui.sign_in_form()
      |> web.html(422)

    Error(InvalidCredentials)
    | Error(SelectingUserByEmailFailed(db.RowNotFound)) ->
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> ui.sign_in_form()
      |> web.html(401)

    Error(SelectingUserByEmailFailed(db.DatabaseFailure(error)))
    | Error(CreatingUserFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.sign_in_form()
      |> web.html(500)
    }

    Error(CreatingUserFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " unexpected database return")
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.sign_in_form()
      |> web.html(500)
    }
  }
}

pub fn sign_out(req: Request, ctx: Ctx) -> Response {
  use session, _user <- guards.require(req, ctx)

  let result = {
    auth_session.delete_by_id(ctx.db, session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> session.clear_cookie(req, guards.cookie_name)

    Error(err) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.sign_out_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }
  }
}
