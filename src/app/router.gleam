import app/ctx.{type Ctx}
import app/web
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> wisp.redirect(to: "/exercises")
    _ -> wisp.not_found()
  }
}
