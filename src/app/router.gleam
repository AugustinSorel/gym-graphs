import app/ctx.{type Ctx}
import app/web
import features/auth/auth
import features/password_reset/password_reset
import features/password_update/password_update
import features/sign_in/sign_in
import features/sign_up/sign_up
import features/user/user
import gleam/http.{Get, Post}
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req, ctx)

  case wisp.path_segments(req) {
    [] -> wisp.redirect(to: "/account")
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
        Post -> password_reset.start(req, ctx)
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["reset-password", "verify-email-code"] ->
      case req.method {
        Get -> {
          use _session <- auth.require_password_reset_unverified(req, ctx)

          password_reset.view_verify_page()
        }
        Post -> {
          use session <- auth.require_password_reset_unverified(req, ctx)

          password_reset.verify(req, session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use session <- auth.require_password_reset(req, ctx)

      password_reset.cancel(req, session, ctx)
    }
    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> {
          use session <- auth.require_password_reset_verified(req, ctx)

          password_reset.view_set_new_password_page(req, session, ctx)
        }
        Post -> {
          use session <- auth.require_password_reset_verified(req, ctx)

          password_reset.set_new_password(req, session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    ["update-password"] -> {
      use <- wisp.require_method(req, Post)
      use session, _user <- auth.require(req, ctx)

      password_update.start(req, session, ctx)
    }

    ["update-password", "verify-password"] -> {
      case req.method {
        Get -> {
          use _session, user <- auth.require_password_update_unverified(
            req,
            ctx,
          )

          password_update.view_verify_password_page(user)
        }
        Post -> {
          use session, user <- auth.require_password_update_unverified(req, ctx)

          password_update.verify_password(req, session, user, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "set-new-password"] -> {
      case req.method {
        Get -> {
          use _session, user <- auth.require_password_update_verified(req, ctx)

          password_update.view_set_new_password_page(user)
        }
        Post -> {
          use session, _user <- auth.require_password_update_verified(req, ctx)
          password_update.set_new_password(req, session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    // ["update-password", "cancel"] -> {
    //   case req.method {
    //     Post -> password_update_handler.cancel(req, ctx)
    //     _ -> wisp.method_not_allowed([Post])
    //   }
    // }
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
    ["sign-out"] -> {
      use <- wisp.require_method(req, Post)
      use session, _user <- auth.require(req, ctx)

      user.sign_out(req, session, ctx)
    }

    ["account"] -> {
      use <- wisp.require_method(req, Get)
      use _session, user <- auth.require(req, ctx)

      user.view_account_page(req, user)
    }

    _ -> wisp.not_found()
  }
}
