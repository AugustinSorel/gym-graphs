import formal/form
import gleam/string

pub opaque type Email {
  Email(value: String)
}

pub fn parse_email() {
  form.parse_email
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(255)
  |> form.map(Email)
}

pub fn email_to_string(email: Email) {
  email.value
}
