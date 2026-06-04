import app/account/account_ui
import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/web
import wisp.{type Request}

pub fn view_page(req: Request, ctx: Ctx) {
  use session <- auth_session.require(req, ctx)

  account_ui.account(session.email_address)
  |> account_ui.page()
  |> web.html(200)
}
