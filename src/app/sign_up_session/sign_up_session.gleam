import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql.{type SelectSignUpSessionByIdRow}
import gleam/result
import wisp.{type Request, type Response}

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  let redirect = wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req)

  let result =
    sign_up_session_cookie.parse(req)
    |> result.try(sign_up_session_token.decode)
    |> result.replace_error(redirect)
    |> result.try(fn(token) {
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(redirect)
    })

  case result {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}
