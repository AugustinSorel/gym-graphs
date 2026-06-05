import app/ctx.{type Ctx}
import app/features/reset_password_verify_email_code/page
import app/features/reset_password_verify_email_code/verify_email_code
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle(req: Request, ctx: Ctx) -> Response {
  case req.method {
    Get -> page.view(req, ctx)
    Post -> verify_email_code.verify(req, ctx)
    _ -> wisp.method_not_allowed([Get, Post])
  }
}

pub fn handle_cancel(_req: Request, _ctx: Ctx) -> Response {
  wisp.not_found()
}
