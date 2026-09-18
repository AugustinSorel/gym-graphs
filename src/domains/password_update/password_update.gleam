import app/crypto
import app/db
import domains/password_update/sql
import gleam/result
import pog.{type Connection}

pub fn create(db: Connection, id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, id, secret_hash)
  |> db.extract_entity
  |> result.map(fn(session) { #(session.id, secret) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_entity
}
