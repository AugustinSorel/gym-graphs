import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/tag/ui
import app/web
import wisp.{type Request, type Response}

pub fn view_new_tag_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- auth_session.require(req, ctx)

  ui.get_new_tag_form()
  |> ui.new_tag_form()
  |> ui.new_tag_page(req)
  |> web.html(200)
}
