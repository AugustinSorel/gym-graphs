import app/sign_up/sign_up_ui
import app/web.{type Context}
import gleam/http.{Get}
import lustre/element
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    ["sign-up"] -> sign_up_page(req)
    _ -> wisp.not_found()
  }
}

fn sign_up_page(req: Request) -> Response {
  use <- wisp.require_method(req, Get)

  sign_up_ui.page()
  |> element.to_string
  |> wisp.html_response(wisp.ok().status)
}
