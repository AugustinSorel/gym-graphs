import app/ctx.{type Ctx}
import wisp.{type Request}

pub fn handle_request(req: Request, _ctx: Ctx) {
  case wisp.path_segments(req) {
    _ -> wisp.ok()
  }
}
