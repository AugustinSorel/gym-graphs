import app/crypto
import app/db
import domains/sign_up_session/sql
import gleam/bool
import gleam/result
import pog.{type Connection}

pub fn create(db: Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sql.create(db, secret_hash, email, verification_code)
  |> db.extract_entity
  |> result.map(fn(session) { #(session.id, secret, verification_code) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_entity
}

pub fn verify_code(stored_code: String, submitted_code: String) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(Nil))

  Ok(Nil)
}

pub fn mark_email_as_verified(db: pog.Connection, session_id: Int) {
  sql.verify(db, session_id)
}
