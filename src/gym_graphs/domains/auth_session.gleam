import gym_graphs/domains/session.{type SessionSecretHash}

pub type AuthSessionId {
  AuthSessionId(value: Int)
}

pub type AuthSession {
  AuthSession(id: AuthSessionId, secret_hash: SessionSecretHash)
}
