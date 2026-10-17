import formal/form
import gleam/bit_array
import gleam/bool
import gleam/crypto
import gleam/int
import gleam/option
import gleam/order
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import gym_graphs/domains/session.{type SessionSecretHash}

pub opaque type EmailVerificationCode {
  EmailVerificationCode(value: String)
}

pub fn generate_email_verification_code() {
  let random_bytes = crypto.strong_random_bytes(4)

  let assert <<n:unsigned-big-size(32)>> = random_bytes

  let code = n % 100_000_000

  string.pad_start(int.to_string(code), 8, "0") |> EmailVerificationCode
}

pub fn parse_email_verification_code() {
  form.parse_string
  |> form.check_not_empty
  |> form.check_string_length_more_than(7)
  |> form.check_string_length_less_than(9)
  |> form.map(EmailVerificationCode)
}

pub fn new_email_verification_code(value: String) {
  EmailVerificationCode(value:)
}

pub fn email_verification_code_to_string(code: EmailVerificationCode) {
  code.value
}

pub fn verify_email_code(
  left: EmailVerificationCode,
  right: EmailVerificationCode,
) {
  let is_valid = {
    crypto.secure_compare(
      bit_array.from_string(left.value),
      bit_array.from_string(right.value),
    )
  }

  use <- bool.guard(when: !is_valid, return: Error(Nil))

  Ok(Nil)
}

pub opaque type SignUpSessionId {
  SignUpSessionId(value: Int)
}

pub fn id_to_int(id: SignUpSessionId) {
  id.value
}

pub opaque type SignUpSession {
  SignUpSession(
    id: SignUpSessionId,
    secret_hash: SessionSecretHash,
    email_address_verification_code: EmailVerificationCode,
    email_address_verified_at: option.Option(timestamp.Timestamp),
    created_at: timestamp.Timestamp,
  )
}

pub fn new(
  id: SignUpSessionId,
  secret_hash: SessionSecretHash,
  email_address_verification_code: EmailVerificationCode,
  email_address_verified_at: option.Option(timestamp.Timestamp),
  created_at: timestamp.Timestamp,
) {
  SignUpSession(
    id:,
    secret_hash:,
    email_address_verification_code:,
    email_address_verified_at:,
    created_at:,
  )
}

pub fn new_id(value: Int) {
  SignUpSessionId(value)
}

pub fn secret_hash(sign_up_session: SignUpSession) {
  sign_up_session.secret_hash
}

pub fn email_address_verified_at(sign_up_session: SignUpSession) {
  sign_up_session.email_address_verified_at
}

pub fn id(sign_up_session: SignUpSession) {
  sign_up_session.id
}

pub fn email_address_verification_code(sign_up_session: SignUpSession) {
  sign_up_session.email_address_verification_code
}

pub fn is_expired(sign_up_session: SignUpSession) {
  let now = timestamp.system_time()

  let difference = timestamp.difference(now, sign_up_session.created_at)

  duration.compare(difference, duration.hours(24)) == order.Gt
}
