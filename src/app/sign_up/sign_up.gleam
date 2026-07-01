import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/session
import app/sign_up/sql
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/time/duration
import pog
import wisp.{type Request, type Response}

pub const cookie_name: String = "sign_up_session_token"

pub fn cookie_max_age() {
  duration.hours(24) |> duration.to_seconds() |> float.round()
}

pub fn require(req, ctx: Ctx, next) {
  let result = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    use session <- result.try(
      select_by_id(ctx.db, token.id) |> result.replace_error(Nil),
    )

    use Nil <- result.try(
      session.validate_token(token, session.secret_hash)
      |> result.replace_error(Nil),
    )

    Ok(session)
  }

  case result {
    Ok(session) -> next(session)
    Error(Nil) -> {
      wisp.redirect("/sign-up") |> session.clear_cookie(req, cookie_name)
    }
  }
}

pub fn require_unverified(req: Request, ctx: Ctx, next) -> Response {
  use session <- require(req, ctx)

  let already_verified = option.is_some(session.email_address_verified_at)

  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/sign-up/set-password"),
  )

  next(session)
}

pub fn require_verified(req: Request, ctx: Ctx, next) -> Response {
  use session <- require(req, ctx)

  let not_verified = option.is_none(session.email_address_verified_at)

  use <- bool.guard(
    when: not_verified,
    return: wisp.redirect("/sign-up/verify-email-address"),
  )

  next(session)
}

pub fn create(db: pog.Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sql.create(db, secret_hash, email, verification_code)
  |> db.extract_first_row
  |> result.map(fn(session) { #(session.id, secret, verification_code) })
}

pub fn verify_code(stored_code: String, submitted_code: String) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(Nil))

  Ok(Nil)
}

pub fn mark_email_as_verified(db: pog.Connection, session_id: Int) {
  sql.verify(db, session_id) |> db.extract_first_row
}

pub fn delete_by_id(db: pog.Connection, session_id: Int) {
  sql.delete_by_id(db, session_id) |> db.extract_first_row
}

pub fn select_by_id(db: pog.Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_first_row
}
