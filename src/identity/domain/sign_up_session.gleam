import gleam/bool
import gleam/option.{type Option}
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp.{type Timestamp}
import identity/domain/email_address.{type EmailAddress}
import identity/domain/events.{type IdentityEvent, SignUpVerificationCodeIssued}
import identity/domain/session_secret.{
  type SessionSecret, type SessionSecretHash,
}
import identity/domain/session_token.{type SessionToken}
import identity/domain/verification_code.{type VerificationCode}

fn validity() {
  duration.hours(24)
}

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
    id: SignUpSessionId,
    email_address: EmailAddress,
    secret_hash: SessionSecretHash,
    code: VerificationCode,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

pub type SignUpSessionStart {
  SignUpSessionStart(
    email: EmailAddress,
    secret: SessionSecret,
    secret_hash: SessionSecretHash,
    code: VerificationCode,
    events: List(IdentityEvent),
  )
}

pub fn start(email: EmailAddress) -> SignUpSessionStart {
  let secret = session_secret.generate()
  let secret_hash = session_secret.hash(secret)
  let code = verification_code.generate()

  SignUpSessionStart(email:, secret:, secret_hash:, code:, events: [
    SignUpVerificationCodeIssued(email:, code:),
  ])
}

pub fn new(
  id: SignUpSessionId,
  email_address: EmailAddress,
  secret_hash: SessionSecretHash,
  code: VerificationCode,
  email_address_verified_at: Option(Timestamp),
  created_at: Timestamp,
) {
  SignUpSession(
    id:,
    email_address:,
    secret_hash:,
    code:,
    email_address_verified_at:,
    created_at:,
  )
}

pub fn id(session: SignUpSession) -> SignUpSessionId {
  session.id
}

pub fn email_address(session: SignUpSession) -> EmailAddress {
  session.email_address
}

pub fn email_address_verified_at(session: SignUpSession) {
  session.email_address_verified_at
}

pub fn secret_hash(session: SignUpSession) -> SessionSecretHash {
  session.secret_hash
}

pub fn code(session: SignUpSession) -> VerificationCode {
  session.code
}

pub fn expired(sign_up_session: SignUpSession, now: Timestamp) -> Bool {
  let expires_at = timestamp.add(sign_up_session.created_at, validity())

  timestamp.compare(expires_at, now) == order.Lt
}

pub fn verify(sign_up_session: SignUpSession, token: SessionToken) {
  let is_secret_valid =
    token
    |> session_token.secret()
    |> session_secret.verify(sign_up_session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(Nil))

  Ok(Nil)
}

pub fn resend(sign_up_session: SignUpSession) -> IdentityEvent {
  SignUpVerificationCodeIssued(
    email: sign_up_session.email_address,
    code: sign_up_session.code,
  )
}

pub fn verify_code(
  sign_up_session: SignUpSession,
  candidate: String,
) -> Result(Nil, Nil) {
  use candidate_code <- result.try(
    verification_code.new(candidate) |> result.replace_error(Nil),
  )

  let is_code_valid =
    verification_code.verify(sign_up_session.code, candidate_code)

  use <- bool.guard(when: !is_code_valid, return: Error(Nil))

  Ok(Nil)
}
