import argus
import gleam/crypto
import gleam/list
import gleam/string

pub type EmailVerificationCode {
  EmailVerificationCode(value: String)
}

pub type EmailVerificationCodeHash {
  EmailVerificationCodeHash(value: String)
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

pub fn hash_email_verification_code(code: EmailVerificationCode) {
  let assert Ok(hashes) = argus.hasher() |> argus.hash(code.value)

  hashes.encoded_hash |> EmailVerificationCodeHash
}
