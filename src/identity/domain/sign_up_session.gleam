pub opaque type SignUpSessionId {
  SignUpSessionId(id: Int)
}

pub fn new_id(raw) {
  SignUpSessionId(raw)
}

pub fn id_to_int(sign_up_session_id: SignUpSessionId) {
  sign_up_session_id.id
}
