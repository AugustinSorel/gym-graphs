import app/ctx.{type Ctx}
import app/sign_up_session/router
import app/web
import gleam/http.{Get, Post}
import lustre/element
import lustre/element/html
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> html.h1([], [element.text("hello")]) |> web.html(200)
    ["sign-up"] -> sign_up_session(req, ctx)
    _ -> wisp.not_found()
  }
}

fn sign_up_session(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> router.view_create_sign_up_session_page()
    Post -> router.create_sign_up_session(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
