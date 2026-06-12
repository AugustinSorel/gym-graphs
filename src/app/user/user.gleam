import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/user/ui
import app/web
import wisp.{type Request, type Response}

pub fn view_account_page(req: Request, ctx: Ctx) -> Response {
  use session <- auth_session.require(req, ctx)

  ui.account_details(session.email_address)
  |> ui.account_page()
  |> web.html(200)
}
