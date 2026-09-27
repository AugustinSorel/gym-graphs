import identity/domain/email_address.{type EmailAddress}
import identity/domain/events.{type IdentityEvent, SignUpVerificationCodeIssued}
import identity/domain/session_secret.{type SessionSecretHash}
import identity/domain/verification_code.{type VerificationCode}

pub opaque type SignUpSessionId {
  SignUpSessionId(id: Int)
}

pub fn new_id(raw) {
  SignUpSessionId(raw)
}

pub fn id_to_int(sign_up_session_id: SignUpSessionId) {
  sign_up_session_id.id
}

pub opaque type SignUpSession {
  SignUpSession(
    email: EmailAddress,
    secret_hash: SessionSecretHash,
    code: VerificationCode,
  )
}

pub fn request(
  email: EmailAddress,
  secret_hash: SessionSecretHash,
  code: VerificationCode,
) -> #(SignUpSession, List(IdentityEvent)) {
  let session = SignUpSession(email:, secret_hash:, code:)
  let events = [SignUpVerificationCodeIssued(email:, code:)]

  #(session, events)
}

pub fn email(session: SignUpSession) -> EmailAddress {
  session.email
}

pub fn secret_hash(session: SignUpSession) -> SessionSecretHash {
  session.secret_hash
}

pub fn code(session: SignUpSession) -> VerificationCode {
  session.code
}
