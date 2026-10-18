import gleam/option
import gleam/result
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/password_update_session.{type PasswordUpdateSessionId}
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

pub fn select_by_id(db: Connection, id: PasswordUpdateSessionId) {
  sql.select_password_update_session_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) ->
        password_update_session.PasswordUpdateSession(
          id: password_update_session.PasswordUpdateSessionId(entity.id),
          auth_session_id: auth_session.AuthSessionId(entity.auth_session_id),
          secret_hash: session.SessionSecretHash(entity.secret_hash),
          user_identity_verified_at: entity.user_identity_verified_at,
          created_at: entity.created_at,
        )
        |> option.Some()
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn verify_by_id(db: Connection, id: PasswordUpdateSessionId) {
  sql.verify_password_update_session_by_id(db, id.value)
}
