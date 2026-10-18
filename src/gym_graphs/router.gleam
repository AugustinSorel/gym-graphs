import gleam/http.{Get, Post}
import gym_graphs/ctx.{type Ctx}
import gym_graphs/handlers/auth_session_handler
import gym_graphs/handlers/password_reset_session_handler
import gym_graphs/handlers/password_update_session_handler
import gym_graphs/handlers/sign_up_session_handler
import gym_graphs/handlers/user_handler
import gym_graphs/middlewares/auth_session_middleware
import gym_graphs/middlewares/password_reset_session_middleware
import gym_graphs/middlewares/password_update_session_middleware
import gym_graphs/middlewares/sign_up_session_middleware
import gym_graphs/web
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req)

  case req.method, wisp.path_segments(req) {
    Get, ["sign-up"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      sign_up_session_handler.view_start_page()
    }
    Post, ["sign-up"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      sign_up_session_handler.start(req, ctx)
    }
    Get, ["sign-up", "verify-email-address"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use _sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.view_verify_email_page()
    }
    Post, ["sign-up", "verify-email-address"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.verify_email(req, sign_up_session, ctx)
    }
    Post, ["sign-up", "verify-email-address", "resend"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.resend(req, sign_up_session, ctx)
    }
    Post, ["sign-up", "verify-email-address", "cancel"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.cancel(req, sign_up_session, ctx)
    }
    Get, ["sign-up", "set-password"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_verified(
        req,
        ctx,
      )

      sign_up_session_handler.view_set_password_page(sign_up_session)
    }
    Post, ["sign-up", "set-password"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_verified(
        req,
        ctx,
      )

      sign_up_session_handler.set_password(req, sign_up_session, ctx)
    }

    Get, ["reset-password"] -> {
      password_reset_session_handler.view_page()
    }
    Post, ["reset-password"] -> {
      password_reset_session_handler.start(req, ctx)
    }
    Get, ["reset-password", "verify-email-code"] -> {
      use _password_reset_session <- password_reset_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_reset_session_handler.view_verify_page()
    }
    Post, ["reset-password", "verify-email-code"] -> {
      use password_reset_session <- password_reset_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_reset_session_handler.verify(req, password_reset_session, ctx)
    }
    Post, ["reset-password", "verify-email-code", "cancel"] -> {
      use password_reset_session <- password_reset_session_middleware.require(
        req,
        ctx,
      )

      password_reset_session_handler.cancel(req, password_reset_session, ctx)
    }
    Get, ["reset-password", "set-new-password"] -> {
      use password_reset_session <- password_reset_session_middleware.require_verified(
        req,
        ctx,
      )

      password_reset_session_handler.view_set_new_password_page(
        req,
        password_reset_session,
        ctx,
      )
    }
    Post, ["reset-password", "set-new-password"] -> {
      use password_reset_session <- password_reset_session_middleware.require_verified(
        req,
        ctx,
      )
      password_reset_session_handler.set_new_password(
        req,
        password_reset_session,
        ctx,
      )
    }

    Post, ["update-password"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)

      password_update_session_handler.start(req, auth_session, ctx)
    }
    Get, ["update-password", "verify-password"] -> {
      use _password_update_session, user <- password_update_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_update_session_handler.view_verify_password_page(user)
    }
    Post, ["update-password", "verify-password"] -> {
      use password_update_session, user <- password_update_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_update_session_handler.verify_password(
        req,
        password_update_session,
        user,
        ctx,
      )
    }
    Get, ["update-password", "set-new-password"] -> {
      use _password_update_session, user <- password_update_session_middleware.require_verified(
        req,
        ctx,
      )

      password_update_session_handler.view_set_new_password_page(user)
    }
    Post, ["update-password", "set-new-password"] -> {
      use password_update_session, _user <- password_update_session_middleware.require_verified(
        req,
        ctx,
      )

      password_update_session_handler.set_new_password(
        req,
        password_update_session,
        ctx,
      )
    }
    Post, ["update-password", "cancel"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)
      use password_update_session <- password_update_session_middleware.require(
        req,
        ctx,
      )

      password_update_session_handler.cancel(
        req,
        auth_session,
        password_update_session,
        ctx,
      )
    }

    Get, ["sign-in"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)

      auth_session_handler.view_sign_in_page()
    }
    Post, ["sign-in"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)

      auth_session_handler.sign_in(req, ctx)
    }

    Get, ["account"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.view_account_page(req, user)
    }

    Post, ["sign-out"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)

      auth_session_handler.sign_out(req, auth_session, ctx)
    }

    _, _ -> wisp.not_found()
  }
}
