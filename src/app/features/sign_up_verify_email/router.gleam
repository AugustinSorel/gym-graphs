import app/ctx.{type Ctx}
import app/features/sign_up_verify_email/cancel
import app/features/sign_up_verify_email/page
import app/features/sign_up_verify_email/resend
import app/features/sign_up_verify_email/verify_email
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> verify_email.verify(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

pub fn handle_resend(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> resend.resend(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}

pub fn handle_cancel(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Post -> cancel.cancel(req, ctx)
    _ -> wisp.method_not_allowed([Post])
  }
}
