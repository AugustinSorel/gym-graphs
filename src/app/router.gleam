import app/account_deletion/account_deletion
import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/password_reset/password_reset
import app/password_update/password_update
import app/sign_up/sign_up
import app/ui
import app/user/user
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
      web.html(
        ui.layout([ui.nav_bar(req), html.h1([], [html.text("exercises")])]),
        200,
      )
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
      user.view_account_page(req, ctx)
    }

    ["account", "name"] -> {
      case req.method {
        Get -> user.view_edit_name_page(req, ctx)
        Patch -> user.update_name(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    ["account", "weight-unit"] -> {
      case req.method {
        Patch -> user.update_weight_unit(req, ctx)
        _ -> wisp.method_not_allowed([Patch])
      }
    }

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
    ["update-password"] -> {
      case req.method {
        Post -> password_update.start(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    ["update-password", "verify-password"] -> {
      case req.method {
        Get -> password_update.view_verify_password_page(req, ctx)
        Post -> password_update.verify_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "set-new-password"] -> {
      case req.method {
        Get -> password_update.view_set_new_password_page(req, ctx)
        Post -> password_update.set_new_password(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "cancel"] -> {
      case req.method {
        Post -> password_update.cancel(req, ctx)
        _ -> wisp.method_not_allowed([Post])
      }
    }
    _ -> wisp.not_found()
  }
}
