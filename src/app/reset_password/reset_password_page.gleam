import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/reset_password/reset_password_ui
import app/web
import wisp.{type Request}

pub fn view_page(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  reset_password_ui.get_form()
  |> reset_password_ui.form()
  |> reset_password_ui.page()
  |> web.html(200)
}
