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

pub type WeightUnit {
  Kg
  Lbs
}

pub type User {
  User(
    id: UserId,
    name: Name,
    email: Email,
    password_hash: PasswordHash,
    weight_unit: WeightUnit,
  )
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

pub fn parse_name() {
  form.parse_string
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(100)
  |> form.map(Name)
}

pub fn parse_weight_unit() {
  form.parse(fn(input) {
    case input {
      ["kg", ..] -> Ok(Kg)
      ["lbs", ..] -> Ok(Lbs)
      _ -> Error(#(Kg, "must be kg or lbs"))
    }
  })
}

pub fn weight_unit_to_string(weight_unit: WeightUnit) -> String {
  case weight_unit {
    Kg -> "kg"
    Lbs -> "lbs"
  }
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
