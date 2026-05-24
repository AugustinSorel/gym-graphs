import app/sign_up/sign_up_router
import app/web.{type Context}
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    ["sign-up"] -> sign_up_page(req)
    _ -> wisp.not_found()
  }
}

fn sign_up_page(req: Request) -> Response {
  case req.method {
    Get -> sign_up_router.view_form()
    Post -> sign_up_router.create_session(req)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
