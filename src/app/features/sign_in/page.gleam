import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/features/sign_in/ui
import app/web
import wisp.{type Request}

pub fn view(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  ui.get_form()
  |> ui.form()
  |> ui.page()
  |> web.html(200)
}
