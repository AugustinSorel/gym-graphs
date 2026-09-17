import app/crypto
import app/db
import domains/auth_session/sql
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}

pub type AuthSession {
  AuthSession(id: Int)
}

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

pub fn refresh(session: sql.SelectByIdRow, db: Connection) {
  let elapsed_vs_threshold =
    timestamp.system_time()
    |> timestamp.difference(session.last_active_at)
    |> duration.compare(duration.hours(12))

  case elapsed_vs_threshold {
    order.Gt -> {
      sql.refresh_last_active_at_by_id(db, session.id)
      |> result.replace(Nil)
      |> result.replace_error(Nil)
    }
    order.Lt | order.Eq -> Ok(Nil)
  }
}
