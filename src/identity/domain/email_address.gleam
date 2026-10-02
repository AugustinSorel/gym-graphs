import gleam/bool
import gleam/string

pub opaque type EmailAddress {
  EmailAddress(value: String)
}

pub type InvalidEmailAddress {
  Empty
  TooLong
  MissingAtSign
}

pub fn new(raw: String) -> Result(EmailAddress, InvalidEmailAddress) {
  let trimmed = raw |> string.trim() |> string.lowercase()

  use <- bool.guard(string.is_empty(trimmed), Error(Empty))
  use <- bool.guard(string.length(trimmed) > 255, Error(TooLong))
  use <- bool.guard(!string.contains(trimmed, "@"), Error(MissingAtSign))

  Ok(EmailAddress(trimmed))
}

pub fn to_string(email: EmailAddress) -> String {
  email.value
}
