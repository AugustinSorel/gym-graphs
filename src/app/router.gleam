import app/ctx.{type Ctx}
import app/register_email/register_email
import app/register_email/register_email_page
import app/set_password/set_password
import app/set_password/set_password_page
import app/sign_in/sign_in
import app/sign_in/sign_in_page
import app/verify_email_address/cancel_verify_email
import app/verify_email_address/resend_email_verification_code
import app/verify_email_address/verify_email_address
import app/verify_email_address/verify_email_address_page
import app/web
import gleam/http.{Get, Post}
import lustre/element
import lustre/element/html
import wisp.{type Request, type Response}

//TODO: logging

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> html.h1([], [element.text("hello")]) |> web.html(200)
    ["sign-up"] -> register_email(req, ctx)
    ["sign-in"] -> handle_sign_in(req, ctx)
    ["verify-email-address"] -> verify_email_address(req, ctx)
    ["verify-email-address", "resend"] -> resend_verification_code(req, ctx)
    ["verify-email-address", "cancel"] -> cancel_verify_email_address(req, ctx)
    ["set-password"] -> set_password(req, ctx)
    _ -> wisp.not_found()
  }
}

fn register_email(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> register_email_page.view_page(req, ctx)
    Post -> register_email.register(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn handle_sign_in(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> sign_in_page.view_page(req, ctx)
    Post -> sign_in.sign_in(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn verify_email_address(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> verify_email_address_page.view_page(req, ctx)
    Post -> verify_email_address.verify(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

fn resend_verification_code(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> resend_email_verification_code.resend(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}

fn cancel_verify_email_address(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> cancel_verify_email.cancel(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}

fn set_password(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> set_password_page.view_page(req, ctx)
    Post -> set_password.set(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}
