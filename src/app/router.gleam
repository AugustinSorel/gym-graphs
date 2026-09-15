import wisp.{type Request}

pub fn handle_request(req: Request) {
  case wisp.path_segments(req) {
    _ -> wisp.ok()
  }
}
