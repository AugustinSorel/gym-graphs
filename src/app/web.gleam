import wisp

pub type Context {
  Context
}

pub fn middleware(
  req: wisp.Request,
  _ctx: Context,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let req = wisp.method_override(req)
  use <- wisp.log_request(req)
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)
  use req <- wisp.csrf_known_header_protection(req)

  let static_dir = get_static_directory()
  use <- wisp.serve_static(req, under: "/static", from: static_dir)

  handle_request(req)
}

pub fn get_static_directory() -> String {
  let assert Ok(priv_directory) = wisp.priv_directory("htmx_auth")

  priv_directory <> "/static"
}
