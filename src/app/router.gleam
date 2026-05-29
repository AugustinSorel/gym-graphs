import app/sign_up_session/router
import app/web.{type Context}
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    ["sign-up"] -> sign_up_session(req)
    _ -> wisp.not_found()
  }
}

fn sign_up_session(req: Request) -> Response {
  case req.method {
    Get -> router.view_create_sign_up_session_page()
    Post -> router.create_sign_up_session(req)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
