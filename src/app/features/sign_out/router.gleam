import app/ctx.{type Ctx}
import app/features/sign_out/sign_out
import gleam/http.{Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> sign_out.sign_out(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}
