import app/ctx.{type Ctx}
import app/features/account/page
import gleam/http.{Get}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    _ -> wisp.method_not_allowed([Get])
  }
}
