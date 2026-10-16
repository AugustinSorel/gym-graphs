import gleam/http.{Get, Post}
import gym_graphs/ctx.{type Ctx}
import gym_graphs/handlers/sign_up_session_handler
import gym_graphs/middlewares/auth_session_middleware
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

    _, _ -> wisp.not_found()
  }
}
