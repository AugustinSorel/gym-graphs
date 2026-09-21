import app/crypto
import app/ctx.{type Ctx}
import app/session
import app/web
import domains/auth_session/auth_session
import domains/user/user
import features/auth/auth
import features/sign_in/forms.{type SignInForm, get_sign_in_form}
import features/sign_in/ui
import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_page() {
  get_sign_in_form()
  |> ui.sign_in_form()
  |> ui.sign_in_page()
  |> web.send_html(200)
}

pub type SignInError {
  SignInFormValidation(Form(SignInForm))
  SignInDatabaseFailure(QueryError)
  InvalidCredentials
}

pub fn sign_in(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SignInFormValidation),
    )

    use user <- result.try(
      user.select_by_email(ctx.db, input.email)
      |> result.map_error(SignInDatabaseFailure),
    )

    let password_valid =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    use #(session, secret) <- result.try(
      auth_session.create(ctx.db, user.id)
      |> result.map_error(SignInDatabaseFailure),
    )

    Ok(session.encode_token(session.id, secret))
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.set_cookie(
        req,
        auth.auth_session_cookie().name,
        token,
        auth.auth_session_cookie().max_age,
      )
    }

    Error(SignInFormValidation(form)) ->
      form
      |> ui.sign_in_form()
      |> web.send_html(422)

    Error(InvalidCredentials) ->
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> ui.sign_in_form()
      |> web.send_html(401)

    Error(SignInDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.sign_in_form()
      |> web.send_html(500)
    }
  }
}
