import app/ctx.{type Ctx}
import app/domain/password_reset_session/password_reset_session_cookie
import app/domain/password_reset_session/password_reset_session_token
import app/domain/password_reset_session/sql.{
  type SelectPasswordResetSessionByIdRow,
}
import gleam/result
import wisp.{type Request, type Response}

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectPasswordResetSessionByIdRow) -> Response,
) -> Response {
  let redirect =
    wisp.redirect("/reset-password")
    |> password_reset_session_cookie.clear(req)

  let result =
    password_reset_session_cookie.parse(req)
    |> result.try(password_reset_session_token.decode)
    |> result.replace_error(redirect)
    |> result.try(fn(token) {
      password_reset_session_token.verify(token, ctx)
      |> result.replace_error(redirect)
    })

  case result {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}
