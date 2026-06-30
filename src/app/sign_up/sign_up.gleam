import app/crypto
import app/db
import app/sign_up/sql
import gleam/bool
import gleam/result
import pog

pub type Session {
  Session(id: Int, secret: BitArray, verification_code: String)
}

pub fn create(db: pog.Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sql.create_sign_up_session(db, secret_hash, email, verification_code)
  |> db.extract_first_row
  |> result.map(fn(session) {
    Session(id: session.id, secret:, verification_code:)
  })
}

pub fn verify_code(stored_code: String, submitted_code: String) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(Nil))

  Ok(Nil)
}

pub fn mark_email_as_verified(db: pog.Connection, session_id: Int) {
  sql.set_email_address_verified_at_to_now(db, session_id)
  |> db.extract_first_row
}

pub fn delete_by_id(db: pog.Connection, session_id: Int) {
  sql.delete_sign_up_session_by_id(db, session_id)
  |> db.extract_first_row
}

pub fn select_by_id(db: pog.Connection, id: Int) {
  sql.select_sign_up_session_by_id(db, id) |> db.extract_first_row
}
