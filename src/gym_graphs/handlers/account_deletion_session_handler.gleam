import formal/form
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session.{type AuthSession}
import gym_graphs/domains/session
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/account_deletion_session_repo
import gym_graphs/schemas/account_deletion_session_schema
import gym_graphs/views/account_deletion_session_view
import gym_graphs/views/user_view
import lustre/element
import wisp.{type Request}

pub fn start(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)

    use account_deletion_session_id <- result.try(
      account_deletion_session_repo.create(ctx.db, auth_session.id, secret_hash),
    )

    Ok(session.encode_token(account_deletion_session_id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> wisp.set_cookie(
        req,
        name: cookie.account_deletion().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.account_deletion().max_age,
      )
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_view.remove_account_row(error: option.Some("something went wrong"))
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_password_page(user: User) {
  account_deletion_session_schema.verify_password()
  |> form.add_values([#("email", user.email.value)])
  |> account_deletion_session_view.verify_password_form()
  |> account_deletion_session_view.verify_password_page()
  |> element.to_string()
  |> wisp.html_response(200)
}
