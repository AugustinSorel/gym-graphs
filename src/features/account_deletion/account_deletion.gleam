import app/ctx.{type Ctx}
import app/session
import app/web
import domains/account_deletion/account_deletion
import domains/auth_session/auth_session.{type AuthSession}
import features/auth/auth
import features/user/ui as user_ui
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request}

pub fn start(req: Request, session: AuthSession, ctx: Ctx) {
  let result = {
    use #(id, secret) <- result.try({
      account_deletion.create(ctx.db, session.id)
    })

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> session.set_cookie(
        req,
        auth.account_deletion_cookie().name,
        token,
        auth.account_deletion_cookie().max_age,
      )

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_ui.remove_account_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}
