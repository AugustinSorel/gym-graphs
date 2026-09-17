import app/crypto
import app/db
import domains/auth_session/sql
import gleam/result
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_entity
}

pub fn create(db: pog.Connection, user_id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, user_id, secret_hash)
  |> db.extract_entity
  |> result.try(fn(session) { Ok(#(session, secret)) })
}
