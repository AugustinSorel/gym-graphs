import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/password_reset/sql
import app/session
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/time/duration
import pog.{type Connection}
import wisp.{type Request, type Response}

pub const cookie_name = "password_reset_session_token"

pub fn cookie_max_age() {
  duration.hours(1) |> duration.to_seconds() |> float.round()
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
      wisp.redirect("/account") |> session.clear_cookie(req, cookie_name)
    }
  }
}

pub fn require_unverified(req: Request, ctx: Ctx, next) -> Response {
  use session <- require(req, ctx)

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/reset-password/set-new-password"),
  )

  next(session)
}

pub fn require_verified(req: Request, ctx: Ctx, next) -> Response {
  use session <- require(req, ctx)

  let not_verified = option.is_none(session.user_identity_verified_at)
  use <- bool.guard(
    when: not_verified,
    return: wisp.redirect("/reset-password/verify-email-code"),
  )

  next(session)
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_first_row
}

pub fn create(db: Connection, email_address: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let email_code = crypto.generate_password_reset_email_code()
  let email_code_salt = crypto.generate_hashing_salt()
  let email_code_hash =
    crypto.hash_password_reset_email_code(email_code, email_code_salt)

  sql.create(
    db,
    secret_hash,
    email_code_hash.raw_hash,
    email_code_salt,
    email_address,
  )
  |> db.extract_first_row
  |> result.try(fn(session) { Ok(#(session.id, secret, email_code)) })
}

pub fn mark_as_verified(db: Connection, id: Int) {
  sql.verify(db, id)
  |> db.extract_first_row
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id)
  |> db.extract_first_row
}
