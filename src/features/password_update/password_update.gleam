import app/ctx.{type Ctx}
import app/session
import app/web
import domains/auth_session/auth_session.{type AuthSession}
import domains/password_update/password_update
import features/auth/auth
import features/user/ui
import gleam/option
import gleam/result
import gleam/string
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
      ui.update_password_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}
