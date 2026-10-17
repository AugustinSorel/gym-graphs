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
import gym_graphs/domains/user.{type Email}

pub type EmailVerificationCode {
  EmailVerificationCode(value: String)
}

pub type SignUpSessionId {
  SignUpSessionId(value: Int)
}

pub type SignUpSession {
  SignUpSession(
    id: SignUpSessionId,
    email: Email,
    secret_hash: SessionSecretHash,
    email_address_verification_code: EmailVerificationCode,
    email_address_verified_at: option.Option(timestamp.Timestamp),
    created_at: timestamp.Timestamp,
  )
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

pub fn is_expired(sign_up_session: SignUpSession) {
  let now = timestamp.system_time()

  let difference = timestamp.difference(now, sign_up_session.created_at)

  duration.compare(difference, duration.hours(24)) == order.Gt
}
