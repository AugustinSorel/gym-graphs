import gleam/http.{Get, Post}
import gym_graphs/ctx.{type Ctx}
import gym_graphs/handlers/auth_session_handler
import gym_graphs/handlers/sign_up_session_handler
import gym_graphs/middlewares/auth_session_middleware
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

    Get, ["sign-in"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)

      auth_session_handler.view_sign_in_page()
    }
    _, _ -> wisp.not_found()
  }
}
