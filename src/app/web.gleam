import app/ctx.{type Ctx}
import lustre/element.{type Element}
import wisp.{type Response}

pub fn middleware(
  req: wisp.Request,
  _ctx: Ctx,
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

fn get_static_directory() -> String {
  let assert Ok(priv_directory) = wisp.priv_directory("gym_graphs")

  priv_directory <> "/static"
}

pub fn html(el: Element(a), status: Int) -> Response {
  wisp.response(status)
  |> wisp.set_header("content-type", "text/html")
  |> wisp.string_tree_body(element.to_string_tree(el))
}

pub fn svg(el: Element(a), status: Int) -> Response {
  wisp.response(status)
  |> wisp.set_header("content-type", "image/svg+xml")
  |> wisp.string_tree_body(element.to_string_tree(el))
}
