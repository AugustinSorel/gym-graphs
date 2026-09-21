import app/crypto
import app/db
import domains/auth_session/sql
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp.{type Timestamp}
import pog.{type Connection}

pub type AuthSession {
  AuthSession(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    last_active_at: Timestamp,
  )
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_entity
  |> result.map(fn(row) {
    AuthSession(
      id: row.id,
      user_id: row.user_id,
      secret_hash: row.secret_hash,
      last_active_at: row.last_active_at,
    )
  })
}

pub fn create(db: pog.Connection, user_id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, user_id, secret_hash)
  |> db.extract_entity
  |> result.try(fn(session) { Ok(#(session, secret)) })
}

pub fn refresh(session: AuthSession, db: Connection) {
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

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id)
}
