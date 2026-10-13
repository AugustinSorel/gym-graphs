import gleam/http.{Get, Post}
import gym_graphs/ctx.{type Ctx}
import gym_graphs/sign_up/handler as sign_up_handler
import gym_graphs/web
import wisp.{type Request}

pub fn handle_request(req: Request, _ctx: Ctx) {
  use req <- web.middleware(req)

  case req.method, wisp.path_segments(req) {
    Get, ["sign-up"] -> sign_up_handler.view_start_page()
    Post, ["sign-up"] -> sign_up_handler.start()

    _, _ -> wisp.not_found()
  }
}
