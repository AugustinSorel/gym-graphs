import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/features/account/ui
import app/web
import wisp.{type Request}

pub fn view(req: Request, ctx: Ctx) {
  use session <- auth_session.require(req, ctx)

  ui.account(session.email_address)
  |> ui.page()
  |> web.html(200)
}
