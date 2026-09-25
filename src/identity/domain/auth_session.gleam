pub opaque type AuthSessionId {
  AuthSessionId(value: Int)
}

pub opaque type AuthSession {
  AuthSession(id: AuthSessionId)
}

pub fn new_id(raw: Int) {
  AuthSessionId(raw)
}

pub fn new(id: AuthSessionId) {
  AuthSession(id:)
}
