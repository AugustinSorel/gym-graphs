import app/ctx.{type Ctx}
import app/register_email/register_email_router
import app/set_password/set_password_router
import app/verify_email_address/verify_email_address_router
import app/web
import gleam/http.{Get, Post}
import lustre/element
import lustre/element/html
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> html.h1([], [element.text("hello")]) |> web.html(200)
    ["sign-up"] -> register_email(req, ctx)
    ["verify-email-address"] -> verify_email_address(req, ctx)
    ["verify-email-address", "resend"] -> resend_verification_code(req, ctx)
    ["verify-email-address", "cancel"] -> cancel_verify_email_address(req, ctx)
    ["set-password"] -> set_password(req, ctx)
    _ -> wisp.not_found()
  }
}

fn register_email(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> register_email_router.view_page()
    Post -> register_email_router.register_email(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn verify_email_address(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> verify_email_address_router.view_verify_email_address_page(req, ctx)
    Post -> verify_email_address_router.verify_email_address(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn resend_verification_code(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> verify_email_address_router.resend_verification_code(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}

fn cancel_verify_email_address(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> verify_email_address_router.cancel_verify_email_address(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}

fn set_password(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> set_password_router.view_set_password_page(req, ctx)
    Post -> set_password_router.set_password(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
