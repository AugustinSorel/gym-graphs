import app/crypto
import app/db
import domains/password_reset/sql
import gleam/option.{type Option}
import gleam/result
import gleam/time/timestamp.{type Timestamp}
import pog.{type Connection}

pub type PasswordReset {
  PasswordReset(
    id: Int,
    user_id: Int,
    email_code_hash: String,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
  )
}

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
  sql.select_by_id(db, id)
  |> db.extract_entity
  |> result.map(fn(row) {
    PasswordReset(
      id: row.id,
      user_id: row.user_id,
      email_code_hash: row.email_code_hash,
      secret_hash: row.secret_hash,
      user_identity_verified_at: row.user_identity_verified_at,
    )
  })
}

pub fn mark_as_verified(db: Connection, id: Int) {
  sql.verify(db, id)
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id)
}
