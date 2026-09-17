import app/ctx.{type Ctx}
import app/web
import features/auth/auth
import features/password_reset/password_reset
import features/sign_in/sign_in
import features/sign_up/sign_up
import gleam/http.{Get, Post}
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> wisp.redirect(to: "/exercises")
    ["sign-up"] -> {
      case req.method {
        Get -> {
          use <- auth.require_blank(req, ctx)
          sign_up.view_start_page()
        }
        Post -> {
          use <- auth.require_blank(req, ctx)
          sign_up.start(req, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address"] -> {
      case req.method {
        Get -> {
          use <- auth.require_blank(req, ctx)
          use _session <- auth.require_sign_up_unverified(req, ctx)

          sign_up.view_verify_email_page()
        }
        Post -> {
          use <- auth.require_blank(req, ctx)
          use session <- auth.require_sign_up_unverified(req, ctx)

          sign_up.verify_email(req, session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      use <- wisp.require_method(req, Post)
      use <- auth.require_blank(req, ctx)
      use session <- auth.require_sign_up_session(req, ctx)

      sign_up.resend_verify_email_code(req, session, ctx)
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use <- auth.require_blank(req, ctx)
      use session <- auth.require_sign_up_unverified(req, ctx)

      sign_up.cancel(req, session, ctx)
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> {
          use <- auth.require_blank(req, ctx)
          use session <- auth.require_sign_up_verified(req, ctx)

          sign_up.view_set_password_page(session)
        }
        Post -> {
          use <- auth.require_blank(req, ctx)
          use session <- auth.require_sign_up_verified(req, ctx)

          sign_up.set_password(req, session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password"] -> {
      case req.method {
        Get -> password_reset.view_page()
        // Post -> password_reset_handler.start(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    // ["reset-password", "verify-email-code"] ->
    //   case req.method {
    //     Get -> password_reset_handler.view_verify_page(req, ctx)
    //     Post -> password_reset_handler.verify(req, ctx)
    //     _ -> wisp.method_not_allowed([Get, Post])
    //   }
    // ["reset-password", "verify-email-code", "cancel"] -> {
    //   case req.method {
    //     Post -> password_reset_handler.cancel(req, ctx)
    //     _ -> wisp.method_not_allowed([Post])
    //   }
    // }
    // ["reset-password", "set-new-password"] -> {
    //   case req.method {
    //     Get -> password_reset_handler.view_set_new_password_page(req, ctx)
    //     Post -> password_reset_handler.set_new_password(req, ctx)
    //     _ -> wisp.method_not_allowed([Get, Post])
    //   }
    ["sign-in"] -> {
      case req.method {
        Get -> {
          use <- auth.require_blank(req, ctx)

          sign_in.view_page()
        }
        Post -> {
          use <- auth.require_blank(req, ctx)

          sign_in.sign_in(req, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    _ -> wisp.not_found()
  }
}
