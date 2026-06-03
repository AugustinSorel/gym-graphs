import app/auth_session/auth_session_cookie
import app/auth_session/auth_session_token
import app/ctx.{type Ctx}
import gleam/result
import wisp.{type Request, type Response}

pub fn require(req: Request, ctx: Ctx, next) -> Response {
  let redirect = wisp.redirect("/sign-up") |> auth_session_cookie.clear(req)

  let res =
    auth_session_cookie.parse(req)
    |> result.try(auth_session_token.decode)
    |> result.replace_error(redirect)
    |> result.try(fn(token) {
      auth_session_token.verify(token, ctx)
      |> result.replace_error(redirect)
    })

  case res {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}

pub fn require_blank(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let res =
    auth_session_cookie.parse(req)
    |> result.try(auth_session_token.decode)
    |> result.try(fn(token) {
      auth_session_token.verify(token, ctx)
      |> result.map_error(fn(_) { Nil })
    })

  case res {
    Ok(_session) -> wisp.redirect("/")
    Error(_) -> next()
  }
}
