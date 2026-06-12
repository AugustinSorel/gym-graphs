import app/auth_session/sign_in
import app/ctx.{type Ctx}
import app/password_reset_session/password_reset
import app/password_reset_session/set_new_password
import app/password_reset_session/verify_email_code
import app/sign_up_session/set_password
import app/sign_up_session/sign_up
import app/sign_up_session/verify_email
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
        Get -> sign_up.view_register_page(req, ctx)
        Post -> sign_up.register(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address"] -> {
      case req.method {
        Get -> verify_email.view_verify_email_page(req, ctx)
        Post -> verify_email.verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      case req.method {
        Post -> verify_email.resend_verify_email_code(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      case req.method {
        Post -> verify_email.cancel_verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> set_password.view_set_password_page(req, ctx)
        Post -> set_password.set_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-in"] -> {
      case req.method {
        Get -> sign_in.view_sign_in_page(req, ctx)
        Post -> sign_in.sign_in(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-out"] -> {
      case req.method {
        Post -> sign_in.sign_out(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["reset-password"] -> {
      case req.method {
        Get -> password_reset.view_password_reset_page()
        Post -> password_reset.register(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password", "verify-email-code"] ->
      case req.method {
        Get -> verify_email_code.view_verify_page(req, ctx)
        Post -> verify_email_code.verify(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      case req.method {
        Post -> verify_email_code.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }

    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> set_new_password.view_set_new_password_page(req, ctx)
        Post -> set_new_password.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    _ -> wisp.not_found()
  }
}
