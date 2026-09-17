import app/crypto
import app/db
import domains/password_reset/sql
import gleam/result
import pog.{type Connection}

pub fn create(db: Connection, email_address: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  let email_code = crypto.generate_password_reset_email_code()
  let email_code_hash = crypto.hash_password_reset_email_code(email_code)

  sql.create(db, secret_hash, email_code_hash, email_address)
  |> db.extract_entity
  |> result.try(fn(session) { Ok(#(session.id, secret, email_code)) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_entity
}

pub fn mark_as_verified(db: Connection, id: Int) {
  sql.verify(db, id)
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id)
}
