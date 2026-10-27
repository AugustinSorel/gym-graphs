import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session.{type AuthSession}
import gym_graphs/domains/session
import gym_graphs/domains/user
import gym_graphs/repos/auth_session_repo
import gym_graphs/repos/user_repo
import gym_graphs/schemas/auth_session_schema.{type SignInSchema}
import gym_graphs/views/auth_session_view
import gym_graphs/views/user_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_sign_in_page() {
  auth_session_schema.sign_in()
  |> auth_session_view.sign_in_form()
  |> auth_session_view.sign_in_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

type SignInError {
  SignInValidation(Form(SignInSchema))
  SignInDatabaseFailure(QueryError)
  InvalidCredentials
}

pub fn sign_in(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      auth_session_schema.sign_in()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SignInValidation),
    )

    use user <- result.try(
      user_repo.select_by_email(ctx.db, input.email)
      |> result.map_error(SignInDatabaseFailure)
      |> result.try(option.to_result(_, InvalidCredentials)),
    )

    let password_valid =
      user.verify_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)

    use auth_session_id <- result.try(
      auth_session_repo.create(ctx.db, user.id, secret_hash)
      |> result.map_error(SignInDatabaseFailure),
    )

    let token = session.encode_token(auth_session_id.value, secret)

    Ok(token)
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/exercises")
      |> wisp.set_cookie(
        req,
        name: cookie.auth_session().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.auth_session().max_age,
      )
    }

    Error(SignInValidation(form)) ->
      form
      |> auth_session_view.sign_in_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(InvalidCredentials) ->
      auth_session_schema.sign_in()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> auth_session_view.sign_in_form()
      |> element.to_string()
      |> wisp.html_response(401)

    Error(SignInDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      auth_session_schema.sign_in()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> auth_session_view.sign_in_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn sign_out(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    auth_session_repo.delete_by_id(ctx.db, auth_session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> wisp.set_cookie(req, cookie.auth_session().name, "", wisp.Signed, 0)

    Error(err) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      user_view.sign_out_row(error: option.Some("something went wrong"))
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
