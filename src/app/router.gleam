import app/account_deletion/account_deletion
import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/password_reset/password_reset
import app/sign_up/sign_up
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
        Get -> sign_up.view_verify_email_page(req, ctx)
        Post -> sign_up.verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      case req.method {
        Post -> sign_up.resend_verify_email_code(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      case req.method {
        Post -> sign_up.cancel_verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> sign_up.view_set_password_page(req, ctx)
        Post -> sign_up.set_password(req, ctx)
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
        Get -> password_reset.view_password_reset_page()
        Post -> password_reset.register(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password", "verify-email-code"] ->
      case req.method {
        Get -> password_reset.view_verify_page(req, ctx)
        Post -> password_reset.verify(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      case req.method {
        Post -> password_reset.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }

    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> password_reset.view_set_new_password_page(req, ctx)
        Post -> password_reset.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account"] -> {
      case req.method {
        Post -> account_deletion.start(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["delete-account", "verify-password"] -> {
      case req.method {
        Get -> account_deletion.view_verify_password_page(req, ctx)
        Post -> account_deletion.verify_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "confirm"] -> {
      case req.method {
        Get -> account_deletion.view_confirm_page(req, ctx)
        Post -> account_deletion.confirm(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "cancel"] -> {
      case req.method {
        Post -> account_deletion.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    _ -> wisp.not_found()
  }
}
