import gleam/option.{type Option}
import gleam/order
import gleam/time/duration
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/auth_session.{type AuthSessionId}
import gym_graphs/domains/session.{type SessionSecretHash}

pub type AccountDeletionSessionId {
  AccountDeletionSessionId(value: Int)
}

pub type AccountDeletionSession {
  AccountDeletionSession(
    id: AccountDeletionSessionId,
    auth_session_id: AuthSessionId,
    secret_hash: SessionSecretHash,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

pub fn is_expired(account_deletion_session: AccountDeletionSession) {
  let now = timestamp.system_time()
  let difference =
    timestamp.difference(now, account_deletion_session.created_at)

  duration.compare(difference, duration.hours(1)) == order.Gt
}
