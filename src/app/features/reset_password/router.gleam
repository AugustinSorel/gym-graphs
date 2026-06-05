import app/ctx.{type Ctx}
import app/features/reset_password/page
import app/features/reset_password/reset_password
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> reset_password.register(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
