import app/ctx.{type Ctx}
import app/web
import features/account_deletion/account_deletion
import features/auth/auth
import features/password_reset/password_reset
import features/password_update/password_update
import features/sign_in/sign_in
import features/sign_up/sign_up
import features/user/user
import gleam/http.{Get, Patch, Post}
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
          use _sign_up_session <- auth.require_sign_up_unverified(req, ctx)

          sign_up.view_verify_email_page()
        }
        Post -> {
          use <- auth.require_blank(req, ctx)
          use sign_up_session <- auth.require_sign_up_unverified(req, ctx)

          sign_up.verify_email(req, sign_up_session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["sign-up", "verify-email-address", "resend"] -> {
      use <- wisp.require_method(req, Post)
      use <- auth.require_blank(req, ctx)
      use sign_up_session <- auth.require_sign_up_session(req, ctx)

      sign_up.resend_verify_email_code(req, sign_up_session, ctx)
    }
    ["sign-up", "verify-email-address", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use <- auth.require_blank(req, ctx)
      use sign_up_session <- auth.require_sign_up_unverified(req, ctx)

      sign_up.cancel(req, sign_up_session, ctx)
    }
    ["sign-up", "set-password"] -> {
      case req.method {
        Get -> {
          use <- auth.require_blank(req, ctx)
          use sign_up_session <- auth.require_sign_up_verified(req, ctx)

          sign_up.view_set_password_page(sign_up_session)
        }
        Post -> {
          use <- auth.require_blank(req, ctx)
          use sign_up_session <- auth.require_sign_up_verified(req, ctx)

          sign_up.set_password(req, sign_up_session, ctx)
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
          use _password_reset_session <- auth.require_password_reset_unverified(
            req,
            ctx,
          )

          password_reset.view_verify_page()
        }
        Post -> {
          use password_reset_session <- auth.require_password_reset_unverified(
            req,
            ctx,
          )

          password_reset.verify(req, password_reset_session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    ["reset-password", "verify-email-code", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use password_reset_session <- auth.require_password_reset(req, ctx)

      password_reset.cancel(req, password_reset_session, ctx)
    }
    ["reset-password", "set-new-password"] -> {
      case req.method {
        Get -> {
          use password_reset_session <- auth.require_password_reset_verified(
            req,
            ctx,
          )

          password_reset.view_set_new_password_page(
            req,
            password_reset_session,
            ctx,
          )
        }
        Post -> {
          use password_reset_session <- auth.require_password_reset_verified(
            req,
            ctx,
          )

          password_reset.set_new_password(req, password_reset_session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }

    ["update-password"] -> {
      use <- wisp.require_method(req, Post)
      use auth_session, _user <- auth.require(req, ctx)

      password_update.start(req, auth_session, ctx)
    }

    ["update-password", "verify-password"] -> {
      case req.method {
        Get -> {
          use _password_update_session, user <- auth.require_password_update_unverified(
            req,
            ctx,
          )

          password_update.view_verify_password_page(user)
        }
        Post -> {
          use password_update_session, user <- auth.require_password_update_unverified(
            req,
            ctx,
          )

          password_update.verify_password(
            req,
            password_update_session,
            user,
            ctx,
          )
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "set-new-password"] -> {
      case req.method {
        Get -> {
          use _password_reset_session, user <- auth.require_password_update_verified(
            req,
            ctx,
          )

          password_update.view_set_new_password_page(user)
        }
        Post -> {
          use password_update_session, _user <- auth.require_password_update_verified(
            req,
            ctx,
          )

          password_update.set_new_password(req, password_update_session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["update-password", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use auth_session, _user <- auth.require(req, ctx)
      use password_update_session <- auth.require_password_update(req, ctx)

      password_update.cancel(req, auth_session, password_update_session, ctx)
    }
    ["delete-account"] -> {
      use <- wisp.require_method(req, Post)
      use auth_session, _user <- auth.require(req, ctx)

      account_deletion.start(req, auth_session, ctx)
    }
    ["delete-account", "verify-password"] -> {
      case req.method {
        Get -> {
          use _account_deletion_session, user <- auth.require_account_deletion_unverified(
            req,
            ctx,
          )

          account_deletion.view_verify_password_page(req, user, ctx)
        }
        Post -> {
          use account_deletion_session, user <- auth.require_account_deletion_unverified(
            req,
            ctx,
          )

          account_deletion.verify_password(
            req,
            account_deletion_session,
            user,
            ctx,
          )
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "confirm"] -> {
      case req.method {
        Get -> {
          use _account_deletion_session, _user <- auth.require_account_deletion_verified(
            req,
            ctx,
          )

          account_deletion.view_confirm_page()
        }
        Post -> {
          use account_deletion_session, _user <- auth.require_account_deletion_verified(
            req,
            ctx,
          )

          account_deletion.confirm(req, account_deletion_session, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    ["delete-account", "cancel"] -> {
      use <- wisp.require_method(req, Post)
      use auth_session, _user <- auth.require(req, ctx)
      use account_deletion_session <- auth.require_account_deletion(req, ctx)

      account_deletion.cancel(req, auth_session, account_deletion_session, ctx)
    }
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
      use auth_session, _user <- auth.require(req, ctx)

      user.sign_out(req, auth_session, ctx)
    }

    ["account"] -> {
      use <- wisp.require_method(req, Get)
      use _auth_session, user <- auth.require(req, ctx)

      user.view_account_page(req, user)
    }

    ["account", "name"] -> {
      case req.method {
        Get -> {
          use _auth_session, user <- auth.require(req, ctx)

          user.view_rename_page(req, user)
        }
        Patch -> {
          use _auth_session, user <- auth.require(req, ctx)

          user.rename(req, user, ctx)
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    _ -> wisp.not_found()
  }
}
