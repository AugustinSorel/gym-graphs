import gleam/bool
import gleam/list
import gleam/string
import kernel/crypto

pub opaque type VerificationCode {
  VerificationCode(value: String)
}

pub type InvalidVerificationCode {
  WrongLength
  NotNumeric
}

const length = 8

pub fn generate() -> VerificationCode {
  VerificationCode(crypto.generate_email_verification_code())
}

pub fn new(raw: String) -> Result(VerificationCode, InvalidVerificationCode) {
  let trimmed = string.trim(raw)

  use <- bool.guard(string.length(trimmed) != length, Error(WrongLength))
  use <- bool.guard(!is_all_digits(trimmed), Error(NotNumeric))

  Ok(VerificationCode(trimmed))
}

pub fn to_string(code: VerificationCode) -> String {
  code.value
}

pub fn verify(expected: VerificationCode, candidate: VerificationCode) -> Bool {
  crypto.validate_verification_code(expected.value, candidate.value)
}

fn is_all_digits(value: String) -> Bool {
  value
  |> string.to_graphemes
  |> list.all(fn(char) {
    case char {
      "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" -> True
      _ -> False
    }
  })
}
