import app/ctx.{type Ctx}
import app/web
import gleam/http.{Get, Post}
import identity/presentation/sign_up/sign_up_controller
import wisp.{type Request}

pub fn handle_request(req: Request, _ctx: Ctx) {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    ["sign-up"] -> {
      case req.method {
        Get -> {
          // use <- guards.require_blank(req, ctx)
          sign_up_controller.view_start_page()
        }
        Post -> {
          // use <- auth.require_blank(req, ctx)
          // sign_up.start(req, ctx)
          todo
        }
        _ -> wisp.method_not_allowed([Get, Post])
      }
    }
    _ -> wisp.not_found()
  }
}
