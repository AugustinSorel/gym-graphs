import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session.{type AuthSession}
import gym_graphs/domains/session
import gym_graphs/repos/password_update_session_repo
import gym_graphs/views/user_view
import lustre/element
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
