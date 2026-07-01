import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/exercise/ui
import app/web
import wisp.{type Request, type Response}

pub fn view_new_exercise_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- auth_session.require(req, ctx)

  ui.get_new_exercise_form()
  |> ui.new_exercise_form()
  |> ui.new_exercise_page(req)
  |> web.html(200)
}
