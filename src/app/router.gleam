import app/ctx.{type Ctx}
import app/web
import features/auth/auth
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
    _ -> wisp.not_found()
  }
}
