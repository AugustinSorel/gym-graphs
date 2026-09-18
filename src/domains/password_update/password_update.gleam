import app/crypto
import app/db
import domains/password_update/sql
import gleam/option.{type Option}
import gleam/result
import gleam/time/timestamp.{type Timestamp}
import pog.{type Connection}

pub type PasswordUpdate {
  PasswordUpdate(
    id: Int,
    secret_hash: BitArray,
    auth_session_id: Int,
    user_identity_verified_at: Option(Timestamp),
  )
}

pub fn create(db: Connection, id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, id, secret_hash)
  |> db.extract_entity
  |> result.map(fn(session) { #(session.id, secret) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_entity
  |> result.map(fn(row) {
    PasswordUpdate(
      id: row.id,
      secret_hash: row.secret_hash,
      auth_session_id: row.auth_session_id,
      user_identity_verified_at: row.user_identity_verified_at,
    )
  })
}

pub fn mark_session_as_verified(db: Connection, id: Int) {
  sql.verify(db, id)
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id)
}
