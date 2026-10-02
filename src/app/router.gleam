import app/ctx.{type Ctx}
import app/web
import gleam/http.{Get, Post}
import identity/presentation/guards
import identity/presentation/sign_up/sign_up_controller
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    ["sign-up"] -> {
      use <- guards.require_guest(req, ctx)

      case req.method {
        Get -> sign_up_controller.view_start_page()
        Post -> sign_up_controller.start(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address"] -> {
      use <- guards.require_guest(req, ctx)
      use sign_up_session <- guards.require_sign_up_unverified(req, ctx)

      case req.method {
        Get -> sign_up_controller.view_verify_email_page()
        Post -> sign_up_controller.verify_email(req, sign_up_session, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      use <- wisp.require_method(req, Post)
      use <- guards.require_guest(req, ctx)
      use sign_up_session <- guards.require_sign_up_unverified(req, ctx)

      sign_up_controller.resend(req, sign_up_session, ctx)
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use <- guards.require_guest(req, ctx)
      use sign_up_session <- guards.require_sign_up_session(req, ctx)

      sign_up_controller.cancel(req, sign_up_session, ctx)
    }
    ["sign-up", "set-password"] -> {
      use <- guards.require_guest(req, ctx)
      use sign_up_session <- guards.require_sign_up_verified(req, ctx)

      case req.method {
        Get -> sign_up_controller.view_set_password_page(sign_up_session)
        // TODO: Post -> sign_up_controller.set_password(req, sign_up_session, ctx)
        _ -> wisp.method_not_allowed([Get])
      }
    }
    _ -> wisp.not_found()
  }
}
