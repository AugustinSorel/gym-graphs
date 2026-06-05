import app/ctx.{type Ctx}
import app/features/account/router as account_router
import app/features/reset_password/router as reset_password_router
import app/features/reset_password_verify_email_code/router as reset_password_verify_email_code_router
import app/features/sign_in/router as sign_in_router
import app/features/sign_out/router as sign_out_router
import app/features/sign_up/router as sign_up_router
import app/features/sign_up_set_password/router as sign_up_set_password_router
import app/features/sign_up_verify_email/router as sign_up_verify_email_router
import app/web
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> account_router.handle(req, ctx)
    ["sign-up"] -> sign_up_router.handle(req, ctx)
    ["sign-up", "verify-email-address"] ->
      sign_up_verify_email_router.handle(req, ctx)
    ["sign-up", "verify-email-address", "resend"] ->
      sign_up_verify_email_router.handle_resend(req, ctx)
    ["sign-up", "verify-email-address", "cancel"] ->
      sign_up_verify_email_router.handle_cancel(req, ctx)
    ["sign-up", "set-password"] -> sign_up_set_password_router.handle(req, ctx)
    ["sign-in"] -> sign_in_router.handle(req, ctx)
    ["sign-out"] -> sign_out_router.handle(req, ctx)
    ["reset-password"] -> reset_password_router.handle(req, ctx)
    ["reset-password", "verify-email-code"] ->
      reset_password_verify_email_code_router.handle(req, ctx)
    ["reset-password", "verify-email-code", "cancel"] ->
      reset_password_verify_email_code_router.handle_cancel(req, ctx)
    _ -> wisp.not_found()
  }
}
