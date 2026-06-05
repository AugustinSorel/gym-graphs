import app/ctx.{type Ctx}
import app/features/sign_up/page
import app/features/sign_up/sign_up
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> sign_up.register(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
