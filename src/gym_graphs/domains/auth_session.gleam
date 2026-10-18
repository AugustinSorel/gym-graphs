import gym_graphs/domains/session.{type SessionSecretHash}
import gym_graphs/domains/user.{type UserId}

pub type AuthSessionId {
  AuthSessionId(value: Int)
}

pub type AuthSession {
  AuthSession(
    id: AuthSessionId,
    user_id: UserId,
    secret_hash: SessionSecretHash,
  )
}
