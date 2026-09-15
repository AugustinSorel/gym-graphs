import app/ctx.{type Ctx}
import app/session
import domains/auth_session/auth_session
import gleam/result
import wisp.{type Request, type Response}

pub const cookie = "auth_session_token"

pub fn require_blank(req: Request, ctx: Ctx, next: fn() -> Response) {
  let res = {
    use cookie <- result.try(session.get_cookie(req, cookie))
    use token <- result.try(session.decode_token(cookie))

    auth_session.select_by_id(ctx.db, token.id)
    |> result.replace_error(Nil)
    |> result.replace(Nil)
  }

  case res {
    Ok(Nil) -> wisp.redirect("/")
    Error(Nil) -> next()
  }
}
