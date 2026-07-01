import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/password_update/sql
import app/session
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/time/duration
import pog.{type Connection}
import wisp.{type Request, type Response}

pub const cookie_name = "password_update_session_token"

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
  use auth_session, user <- auth_session.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> session.clear_cookie(req, cookie_name),
  )

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/update-password/set-new-password"),
  )

  next(session, user)
}

pub fn require_verified(req: Request, ctx: Ctx, next) -> Response {
  use auth_session, user <- auth_session.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> session.clear_cookie(req, cookie_name),
  )

  let is_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: !is_verified,
    return: wisp.redirect("/update-password/verify-password"),
  )

  next(session, user)
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_first_row
}

pub fn create(db: Connection, id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, id, secret_hash)
  |> db.extract_first_row
  |> result.map(fn(session) { #(session.id, secret) })
}

pub fn mark_session_as_verified(db: Connection, id: Int) {
  sql.verify(db, id) |> db.extract_first_row
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id) |> db.extract_first_row
}
