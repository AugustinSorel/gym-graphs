import app/crypto
import app/db
import app/password_reset/sql
import gleam/result
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_password_reset_session_by_id(db, id)
  |> db.extract_first_row
}

pub fn create(db: Connection, email_address: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let email_code = crypto.generate_password_reset_email_code()
  let email_code_salt = crypto.generate_hashing_salt()
  let email_code_hash =
    crypto.hash_password_reset_email_code(email_code, email_code_salt)

  sql.create_password_reset_session(
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
  sql.set_password_reset_session_to_verified_by_id(db, id)
  |> db.extract_first_row
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_password_reset_session_by_id(db, id)
  |> db.extract_first_row
}

pub fn select_user_by_session_id(db: Connection, id: Int) {
  sql.select_user_by_password_reset_session_id(db, id)
  |> db.extract_first_row
}
