import app/ctx.{type Ctx}
import app/web
import lustre/element
import lustre/element/html
import wisp.{type Request}

pub fn handle_request(req: Request, _ctx: Ctx) {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    ["hello"] -> {
      html.h1([], [html.text("hello world")])
      |> element.to_string
      |> wisp.html_response(200)
    }
    _ -> wisp.not_found()
  }
}
