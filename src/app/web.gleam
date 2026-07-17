import app/ctx.{type Ctx}
import gleam/http
import gleam/http/response.{Response as HttpResponse}
import gleam/list
import gleam/string
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
  |> strip_secure_flag(req)
}

/// Dev-only: when serving over plain HTTP from a non-localhost host (e.g. a
/// LAN IP accessed from a phone), Wisp unconditionally sets the Secure flag on
/// cookies. Browsers silently discard Secure cookies received over HTTP, so
/// auth never works. This strips "; Secure" from every Set-Cookie header when
/// the request arrived over plain HTTP on a non-localhost host.
fn strip_secure_flag(response: wisp.Response, req: wisp.Request) -> wisp.Response {
  let is_plain_http_lan =
    req.scheme == http.Http
    && req.host != "localhost"
    && req.host != "127.0.0.1"
    && req.host != "[::1]"

  case is_plain_http_lan {
    False -> response
    True -> {
      let patched_headers =
        list.map(response.headers, fn(header) {
          case header {
            #("set-cookie", value) -> #(
              "set-cookie",
              value
                |> string.replace("; Secure", "")
                |> string.replace(";Secure", ""),
            )
            _ -> header
          }
        })
      HttpResponse(..response, headers: patched_headers)
    }
  }
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
