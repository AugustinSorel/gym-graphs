import gleam/option
import gleam/result
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/session
import gym_graphs/sql
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: AuthSessionId) {
  sql.select_auth_session_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        option.Some(auth_session.AuthSession(
          auth_session.AuthSessionId(entity.id),
          session.SessionSecretHash(entity.secret_hash),
        ))
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}
