import app/web.{type Context}
import gleam/http.{Get}
import lustre/element
import lustre/element/html
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

  web.layout(
    html.main([], [
      html.h1([], [html.text("let's sign up")]),
      html.form([], [
        html.label([], [html.text("email")]),
        html.input([]),
        html.button([], [html.text("continue")]),
      ]),
    ]),
  )
  |> element.to_string
  |> wisp.html_response(wisp.ok().status)
}
