import app/ctx.{type Ctx}
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  // use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    _ -> wisp.not_found()
  }
}
