import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/sign_in/sign_in_ui
import app/web
import wisp.{type Request}

pub fn view_page(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  sign_in_ui.get_form()
  |> sign_in_ui.form()
  |> sign_in_ui.page()
  |> web.html(200)
}
