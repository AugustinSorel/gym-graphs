import app/ctx.{type Ctx}
import app/sign_up_session/router
import app/verify_email_address/router as verify_email_address_router
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
    ["verify-email-address"] -> verify_email_address(req)
    ["verify-email-address", "resend"] -> resend_verification_code(req)
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

fn verify_email_address(req: Request) -> Response {
  case req.method {
    Get -> verify_email_address_router.view_verify_email_address_page()
    Post -> verify_email_address_router.verify_email_address(req)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn resend_verification_code(req: Request) -> Response {
  case req.method {
    Post -> verify_email_address_router.resend_verification_code(req)
    _ -> wisp.method_not_allowed([Post])
  }
}
