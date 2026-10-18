import argus
import formal/form
import gleam/list
import gleam/result
import gleam/string

pub type Email {
  Email(value: String)
}

pub type Name {
  Name(value: String)
}

pub type PasswordHash {
  PasswordHash(value: String)
}

pub type UserId {
  UserId(value: Int)
}

pub type User {
  User(id: UserId, email: Email, password_hash: PasswordHash)
}

pub fn parse_email() {
  form.parse_email
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(255)
  |> form.map(Email)
}

pub fn new_name(email: Email) {
  email.value
  |> string.split(on: "@")
  |> list.first()
  |> result.unwrap("unknown")
  |> Name
}

pub fn parse_password() {
  form.parse_string
  |> form.check_not_empty
  |> form.check_string_length_more_than(7)
  |> form.check_string_length_less_than(72)
  |> form.map(fn(password) {
    let assert Ok(hashes) = argus.hasher() |> argus.hash(password)

    PasswordHash(hashes.encoded_hash)
  })
}

pub fn verify_password(left: PasswordHash, right: String) {
  left.value |> argus.verify(right) |> result.unwrap(False)
}
