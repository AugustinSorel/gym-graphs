import app/ctx.{type Ctx}
import app/features/sign_in/page
import app/features/sign_in/sign_in
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> sign_in.sign_in(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
