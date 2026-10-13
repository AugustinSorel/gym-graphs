import gleam/http.{Get, Post}
import src/ctx.{type Ctx}
import src/web
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req)

  case #(req.method, wisp.path_segments(req)) {
    #(Get, ["sign-up"]) -> todo
    #(Post, ["sign-up"]) -> todo

    _ -> wisp.not_found()
  }
}
