import gleam/result
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/session.{type SessionSecretHash}
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  auth_session_id: AuthSessionId,
  secret_hash: SessionSecretHash,
) {
  sql.create_password_update_session(
    db,
    auth_session_id.value,
    secret_hash.value,
  )
  |> result.map(fn(returned) {
    let assert pog.Returned(count: 1, rows: [entity]) = returned
    entity.id
  })
}
