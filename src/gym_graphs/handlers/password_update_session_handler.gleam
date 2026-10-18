import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session.{type AuthSession}
import gym_graphs/domains/password_update_session.{type PasswordUpdateSession}
import gym_graphs/domains/session
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/password_update_session_repo
import gym_graphs/schemas/password_update_session_schema.{
  type VerifyPasswordSchema,
}
import gym_graphs/views/password_update_session_view
import gym_graphs/views/user_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn start(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)

    use password_update_session_id <- result.try(
      password_update_session_repo.create(ctx.db, auth_session.id, secret_hash),
    )

    Ok(session.encode_token(password_update_session_id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/verify-password")
      |> wisp.set_cookie(
        req,
        name: cookie.password_update().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.password_update().max_age,
      )
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_view.update_password_row(error: option.Some("something went wrong"))
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_password_page(user: User) {
  password_update_session_schema.verify_password()
  |> form.add_values([#("email", user.email.value)])
  |> password_update_session_view.verify_password_form()
  |> password_update_session_view.verify_password_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordSchema))
  VerifyPasswordDatabaseFailure(QueryError)
  IncorrectPassword
}

pub fn verify_password(
  req: Request,
  password_update_session: PasswordUpdateSession,
  user: User,
  ctx: Ctx,
) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_update_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyPasswordValidation),
    )

    use <- bool.guard(
      when: !user.verify_password(user.password_hash, input.password),
      return: Error(IncorrectPassword),
    )

    password_update_session_repo.verify_by_id(
      ctx.db,
      password_update_session.id,
    )
    |> result.map_error(VerifyPasswordDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/set-new-password")

    Error(VerifyPasswordValidation(form)) ->
      form
      |> password_update_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(IncorrectPassword) ->
      password_update_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> password_update_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(VerifyPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_update_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_update_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
