import app/ctx.{type Ctx}
import gleam/bool
import gleam/option
import gleam/result
import identity/application/auth_session
import identity/application/sign_up
import identity/domain/sign_up_session
import identity/presentation/cookie
import identity/presentation/session_cookie
import wisp.{type Request, type Response}

pub fn require_guest(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let valid = {
    use cookie <- result.try(session_cookie.get(req, cookie.auth_session()))

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

pub fn require_sign_up_session(
  req: Request,
  ctx: Ctx,
  next: fn(sign_up_session.SignUpSession) -> Response,
) -> Response {
  let result = {
    use cookie <- result.try(session_cookie.get(req, cookie.sign_up_session()))

    use sign_up_session <- result.try({
      sign_up.authenticate(ctx.sign_up_session_repo(ctx), cookie)
      |> result.replace_error(Nil)
    })

    Ok(sign_up_session)
  }

  case result {
    Ok(sign_up_sess) -> next(sign_up_sess)
    Error(Nil) -> {
      wisp.redirect("/sign-up")
      |> session_cookie.clear(req, cookie.sign_up_session())
    }
  }
}

pub fn require_sign_up_unverified(req, ctx, next) {
  use sign_up_session <- require_sign_up_session(req, ctx)

  let already_verified =
    option.is_some(sign_up_session.email_address_verified_at(sign_up_session))

  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/sign-up/set-password"),
  )

  next(sign_up_session)
}
