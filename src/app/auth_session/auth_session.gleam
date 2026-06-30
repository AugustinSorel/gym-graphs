import app/auth_session/sql.{type SelectAuthSessionByIdRow}
import app/crypto
import app/db
import app/user/sql as user_sql
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}

pub type AuthSession {
  AuthSession(id: Int)
}

pub type User {
  User(
    id: Int,
    name: String,
    email: String,
    created_at: timestamp.Timestamp,
    weight_unit: user_sql.WeightUnit,
  )
}

pub fn create(db: pog.Connection, user_id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create_auth_session(db, user_id, secret_hash)
  |> db.extract_first_row
  |> result.try(fn(session) { Ok(#(session, secret)) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_auth_session_by_id(db, id)
  |> db.extract_first_row
}

pub fn refresh(session: SelectAuthSessionByIdRow, db: Connection) {
  let elapsed_vs_threshold =
    timestamp.system_time()
    |> timestamp.difference(session.last_active_at)
    |> duration.compare(duration.hours(12))

  case elapsed_vs_threshold {
    order.Gt -> {
      sql.update_auth_session_last_active_at(db, session.id)
      |> echo
      |> result.replace(Nil)
      |> result.replace_error(Nil)
    }
    order.Lt | order.Eq -> Ok(Nil)
  }
}
