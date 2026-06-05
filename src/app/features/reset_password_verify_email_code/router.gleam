import app/ctx.{type Ctx}
import app/features/reset_password_verify_email_code/page
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> wisp.not_found()
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

pub fn handle_resend(_req: Request, _ctx: Ctx) -> Response {
  wisp.not_found()
}

pub fn handle_cancel(_req: Request, _ctx: Ctx) -> Response {
  wisp.not_found()
}
