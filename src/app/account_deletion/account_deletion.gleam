import app/account_deletion/sql
import app/crypto
import app/db
import gleam/result
import pog.{type Connection}

pub fn mark_session_as_verified(db: Connection, id: Int) {
  sql.verify(db, id) |> db.extract_first_row
}

pub fn create(db: Connection, id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, id, secret_hash)
  |> db.extract_first_row
  |> result.map(fn(session) { #(session.id, secret) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_first_row
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id) |> db.extract_first_row
}
