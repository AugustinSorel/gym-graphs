import app/account_deletion/handler as account_deletion_handler
import app/auth_session/handler as auth_session_handler
import app/ctx.{type Ctx}
import app/exercise/handler as exercise_handler
import app/password_reset/handler as password_reset_handler
import app/password_update/handler as password_update_handler
import app/sign_up/handler as sign_up_handler
import app/ui
import app/user/handler as user_handler
import app/web
import gleam/http.{Get, Patch, Post}
import lustre/element/html
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, ctx: Ctx) -> Response {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> wisp.redirect(to: "/exercises")
    ["exercises"] -> {
      use <- wisp.require_method(req, Get)
      exercise_handler.view_exercises_page(req, ctx)
    }

    ["exercises", "new"] -> {
      case req.method {
        Get -> exercise_handler.view_new_exercise_page(req, ctx)
        Post -> exercise_handler.create_exercise(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    ["stats"] -> {
      use <- wisp.require_method(req, Get)
      web.html(
        ui.layout([ui.nav_bar(req), html.h1([], [html.text("stats")])]),
        200,
      )
    }

    ["account"] -> {
      use <- wisp.require_method(req, Get)
      user_handler.view_account_page(req, ctx)
    }

    ["account", "name"] -> {
      case req.method {
        Get -> user_handler.view_edit_name_page(req, ctx)
        Patch -> user_handler.update_name(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    ["account", "weight-unit"] -> {
      case req.method {
        Patch -> user_handler.update_weight_unit(req, ctx)
        _ -> wisp.method_not_allowed([Patch])
      }
    }

    ["sign-up"] -> {
      case req.method {
        Get -> sign_up_handler.view_register_page(req, ctx)
        Post -> sign_up_handler.start(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address"] -> {
      case req.method {
        Get -> sign_up_handler.view_verify_email_page(req, ctx)
        Post -> sign_up_handler.verify_email(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      case req.method {
        Post -> sign_up_handler.resend_verify_email_code(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      case req.method {
        Post -> sign_up_handler.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> sign_up_handler.view_set_password_page(req, ctx)
        Post -> sign_up_handler.set_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-in"] -> {
      case req.method {
        Get -> auth_session_handler.view_sign_in_page(req, ctx)
        Post -> auth_session_handler.sign_in(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-out"] -> {
      case req.method {
        Post -> auth_session_handler.sign_out(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["reset-password"] -> {
      case req.method {
        Get -> password_reset_handler.view_password_reset_page()
        Post -> password_reset_handler.start(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password", "verify-email-code"] ->
      case req.method {
        Get -> password_reset_handler.view_verify_page(req, ctx)
        Post -> password_reset_handler.verify(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      case req.method {
        Post -> password_reset_handler.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }

    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> password_reset_handler.view_set_new_password_page(req, ctx)
        Post -> password_reset_handler.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account"] -> {
      case req.method {
        Post -> account_deletion_handler.start(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["delete-account", "verify-password"] -> {
      case req.method {
        Get -> account_deletion_handler.view_verify_password_page(req, ctx)
        Post -> account_deletion_handler.verify_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "confirm"] -> {
      case req.method {
        Get -> account_deletion_handler.view_confirm_page(req, ctx)
        Post -> account_deletion_handler.confirm(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "cancel"] -> {
      case req.method {
        Post -> account_deletion_handler.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["update-password"] -> {
      case req.method {
        Post -> password_update_handler.start(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["update-password", "verify-password"] -> {
      case req.method {
        Get -> password_update_handler.view_verify_password_page(req, ctx)
        Post -> password_update_handler.verify_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "set-new-password"] -> {
      case req.method {
        Get -> password_update_handler.view_set_new_password_page(req, ctx)
        Post -> password_update_handler.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "cancel"] -> {
      case req.method {
        Post -> password_update_handler.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    _ -> wisp.not_found()
  }
}
