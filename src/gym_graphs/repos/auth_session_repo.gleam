import gleam/option
import gleam/result
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/session.{type SessionSecretHash}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/sql
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: AuthSessionId) {
  sql.select_auth_session_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        new_auth_session(entity.id, entity.secret_hash) |> option.Some()
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn create(db: Connection, user_id: UserId, secret_hash: SessionSecretHash) {
  sql.create_auth_session(db, user_id.value, secret_hash.value)
  |> result.map(fn(returned) {
    let assert pog.Returned(count: 1, rows: [entity]) = returned
    auth_session.AuthSessionId(entity.id)
  })
}

fn new_auth_session(id: Int, secret_hash: BitArray) {
  auth_session.AuthSession(
    auth_session.AuthSessionId(id),
    session.SessionSecretHash(secret_hash),
  )
}
