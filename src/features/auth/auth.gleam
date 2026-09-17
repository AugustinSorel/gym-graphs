import app/ctx.{type Ctx}
import app/session
import domains/auth_session/auth_session
import domains/sign_up_session/sign_up_session
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/time/duration
import wisp.{type Request, type Response}

pub type Cookie {
  Cookie(name: String, max_age: Int)
}

pub fn auth_session_cookie() {
  Cookie(
    "auth_session_token",
    duration.hours(24 * 7) |> duration.to_seconds() |> float.round(),
  )
}

pub fn sign_up_session_cookie() {
  Cookie(
    "sign_up_session_token",
    duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}

pub fn password_reset_cookie() {
  Cookie(
    "password_reset_session_token",
    duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}

pub fn require_blank(req: Request, ctx: Ctx, next: fn() -> Response) {
  let res = {
    use cookie <- result.try(session.get_cookie(req, auth_session_cookie().name))
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

pub fn require_sign_up_session(req: Request, ctx: Ctx, next) -> Response {
  let result = {
    use cookie <- result.try(session.get_cookie(
      req,
      sign_up_session_cookie().name,
    ))
    use token <- result.try(session.decode_token(cookie))

    use sign_up_sess <- result.try(
      sign_up_session.select_by_id(ctx.db, token.id)
      |> result.replace_error(Nil),
    )

    use Nil <- result.try(
      session.validate_token(token, sign_up_sess.secret_hash)
      |> result.replace_error(Nil),
    )

    Ok(sign_up_sess)
  }

  case result {
    Ok(sign_up_sess) -> next(sign_up_sess)
    Error(Nil) -> {
      wisp.redirect("/sign-up")
      |> session.clear_cookie(req, sign_up_session_cookie().name)
    }
  }
}

pub fn require_sign_up_unverified(req: Request, ctx: Ctx, next) -> Response {
  use sign_up_sess <- require_sign_up_session(req, ctx)

  let already_verified = option.is_some(sign_up_sess.email_address_verified_at)

  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/sign-up/set-password"),
  )

  next(sign_up_sess)
}

pub fn require_sign_up_verified(req: Request, ctx: Ctx, next) -> Response {
  use sign_up_sess <- require_sign_up_session(req, ctx)

  let not_verified = option.is_none(sign_up_sess.email_address_verified_at)

  use <- bool.guard(
    when: not_verified,
    return: wisp.redirect("/sign-up/verify-email-address"),
  )

  next(sign_up_sess)
}
