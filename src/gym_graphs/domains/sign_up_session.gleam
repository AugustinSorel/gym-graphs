import gleam/crypto
import gleam/int
import gleam/string

pub opaque type EmailVerificationCode {
  EmailVerificationCode(value: String)
}

pub fn generate_email_verification_code() {
  let random_bytes = crypto.strong_random_bytes(4)

  let assert <<n:unsigned-big-size(32)>> = random_bytes

  let code = n % 100_000_000

  string.pad_start(int.to_string(code), 8, "0") |> EmailVerificationCode
}

pub fn email_verification_code_to_string(code: EmailVerificationCode) {
  code.value
}

pub opaque type SignUpSessionId {
  SignUpSessionId(value: Int)
}

pub fn id_to_int(sign_up_session: SignUpSession) {
  sign_up_session.id.value
}

pub opaque type SignUpSession {
  SignUpSession(id: SignUpSessionId)
}

pub fn new(id: SignUpSessionId) {
  SignUpSession(id)
}

pub fn new_id(value: Int) {
  SignUpSessionId(value)
}
