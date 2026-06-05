import app/ctx.{type Ctx}
import app/features/sign_up_set_password/page
import app/features/sign_up_set_password/set_password
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> set_password.set(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
