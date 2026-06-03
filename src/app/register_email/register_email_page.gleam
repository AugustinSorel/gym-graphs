import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/register_email/register_email_ui
import app/web
import wisp.{type Request}

pub fn view_page(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  register_email_ui.get_form()
  |> register_email_ui.form()
  |> register_email_ui.page()
  |> web.html(200)
}
