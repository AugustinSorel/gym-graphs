import argus
import formal/form
import gleam/crypto
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/time/timestamp
import gym_graphs/domains/session.{type SessionSecretHash}
import gym_graphs/domains/user.{type UserId}

pub type EmailVerificationCode {
  EmailVerificationCode(value: String)
}

pub type EmailVerificationCodeHash {
  EmailVerificationCodeHash(value: String)
}

pub type PasswordResetSessionId {
  PasswordResetSessionId(value: Int)
}

pub type PasswordResetSession {
  PasswordResetSession(
    id: PasswordResetSessionId,
    user_id: UserId,
    secret_hash: SessionSecretHash,
    email_code_hash: EmailVerificationCodeHash,
    user_identity_verified_at: option.Option(timestamp.Timestamp),
  )
}

pub fn generate_email_verification_code() {
  let alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let random_bytes = crypto.strong_random_bytes(5)

  let assert <<a:5, b:5, c:5, d:5, e:5, f:5, g:5, h:5>> = random_bytes

  [a, b, c, d, e, f, g, h]
  |> list.map(fn(i) { string.slice(alphabet, i, 1) })
  |> string.join("")
  |> EmailVerificationCode
}

pub fn parse_email_verification_code() {
  form.parse_string
  |> form.map(string.uppercase)
  |> form.check_not_empty
  |> form.check_string_length_more_than(7)
  |> form.check_string_length_less_than(9)
  |> form.map(EmailVerificationCode)
}

pub fn hash_email_verification_code(code: EmailVerificationCode) {
  let assert Ok(hashes) = argus.hasher() |> argus.hash(code.value)

  hashes.encoded_hash |> EmailVerificationCodeHash
}

pub fn verify(left: EmailVerificationCodeHash, right: EmailVerificationCode) {
  argus.verify(left.value, right.value) |> result.unwrap(False)
}
