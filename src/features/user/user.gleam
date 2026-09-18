import app/ctx
import app/session
import app/web
import domains/auth_session/auth_session.{type AuthSession}
import domains/user/user.{type User}
import features/auth/auth
import features/user/ui
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request}

pub fn view_account_page(req: Request, user: User) {
  ui.account_details(user)
  |> ui.account_page(req.path)
  |> web.send_html(200)
}

pub fn sign_out(req: Request, session: AuthSession, ctx: ctx.Ctx) {
  let result = {
    auth_session.delete_by_id(ctx.db, session.id)
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
