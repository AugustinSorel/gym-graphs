import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/password_reset_session/password_reset_session
import app/sign_up_session/sign_up_session
import app/user/user
import app/web
import gleam/http.{Get, Post}
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> user.view_account_page(req, ctx)
    ["sign-up"] -> {
      case req.method {
        Get -> sign_up_session.view_register_page(req, ctx)
        Post -> sign_up_session.register(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address"] -> {
      case req.method {
        Get -> sign_up_session.view_verify_email_page(req, ctx)
        Post -> sign_up_session.verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      case req.method {
        Post -> sign_up_session.resend_verify_email_code(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      case req.method {
        Post -> sign_up_session.cancel_verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> user.view_set_password_page(req, ctx)
        Post -> user.set_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-in"] -> {
      case req.method {
        Get -> auth_session.view_sign_in_page(req, ctx)
        Post -> auth_session.sign_in(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-out"] -> {
      case req.method {
        Post -> auth_session.sign_out(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["reset-password"] -> {
      case req.method {
        Get -> password_reset_session.view_password_reset_page()
        Post -> password_reset_session.register(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password", "verify-email-code"] ->
      case req.method {
        Get -> password_reset_session.view_verify_page(req, ctx)
        Post -> password_reset_session.verify(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      case req.method {
        Post -> password_reset_session.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }

    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> user.view_set_new_password_page(req, ctx)
        Post -> user.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    _ -> wisp.not_found()
  }
}
