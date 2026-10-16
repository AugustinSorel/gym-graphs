import gym_graphs/domains/session.{type SessionSecretHash}

pub opaque type AuthSessionId {
  AuthSessionId(value: Int)
}

pub fn new_id(value: Int) {
  AuthSessionId(value:)
}

pub fn id_to_int(id: AuthSessionId) {
  id.value
}

pub opaque type AuthSession {
  AuthSession(id: AuthSessionId, secret_hash: SessionSecretHash)
}

pub fn new(id: AuthSessionId, secret_hash: SessionSecretHash) {
  AuthSession(id:, secret_hash:)
}

pub fn secret_hash(auth_session: AuthSession) {
  auth_session.secret_hash
}
