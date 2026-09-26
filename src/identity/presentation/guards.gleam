import app/ctx.{type Ctx}
import gleam/bool
import gleam/result
import identity/application/auth_session
import identity/presentation/session_cookie
import wisp.{type Request, type Response}

pub fn require_guest(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let valid = {
    use cookie <- result.try({
      session_cookie.get(req, session_cookie.auth_session_cookie())
    })

    use Nil <- result.try({
      auth_session.authenticate(ctx.auth_session_repo(ctx), cookie)
      |> result.replace_error(Nil)
    })

    Ok(Nil)
  }

  bool.guard(
    when: result.is_ok(valid),
    return: wisp.redirect("/"),
    otherwise: next,
  )
}
