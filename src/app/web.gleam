import lustre/element.{type Element}
import pog
import wisp.{type Response}

pub type Context {
  Context(db: pog.Connection)
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

pub fn html(el: Element(a), status: Int) -> Response {
  wisp.response(status)
  |> wisp.set_header("content-type", "text/html")
  |> wisp.string_tree_body(element.to_string_tree(el))
}

pub fn require_ok(
  result: Result(data, Response),
  next next: fn(data) -> Response,
) -> Response {
  case result {
    Ok(data) -> next(data)
    Error(err) -> err
  }
}
