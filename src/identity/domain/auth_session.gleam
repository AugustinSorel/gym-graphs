import gleam/bool
import gleam/time/timestamp.{type Timestamp}
import identity/domain/session_secret.{type SessionSecretHash}
import identity/domain/session_token.{type SessionToken}

pub opaque type AuthSessionId {
  AuthSessionId(value: Int)
}

pub opaque type AuthSession {
  AuthSession(
    id: AuthSessionId,
    secret_hash: SessionSecretHash,
    last_active_at: Timestamp,
  )
}

pub fn new_id(raw: Int) {
  AuthSessionId(raw)
}

pub fn new(
  id: AuthSessionId,
  secret_hash: SessionSecretHash,
  last_active_at: Timestamp,
) {
  AuthSession(id:, secret_hash:, last_active_at:)
}

pub fn id(id: AuthSessionId) {
  id.value
}

pub fn verify(auth_session: AuthSession, token: SessionToken) {
  let is_secret_valid =
    session_secret.verify(session_token.secret(token), auth_session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(Nil))

  Ok(Nil)
}
