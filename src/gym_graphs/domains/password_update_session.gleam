import gleam/option.{type Option}
import gleam/order
import gleam/time/duration
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/session.{type SessionSecretHash}

pub type PasswordUpdateSessionId {
  PasswordUpdateSessionId(value: Int)
}

pub type PasswordUpdateSession {
  PasswordUpdateSession(
    id: PasswordUpdateSessionId,
    auth_session_id: AuthSessionId,
    secret_hash: SessionSecretHash,
    user_identity_verified_at: Option(Timestamp),
    created_at: timestamp.Timestamp,
  )
}

pub fn is_expired(password_update_session: PasswordUpdateSession) {
  let now = timestamp.system_time()

  let difference = timestamp.difference(now, password_update_session.created_at)

  duration.compare(difference, duration.hours(1)) == order.Gt
}
