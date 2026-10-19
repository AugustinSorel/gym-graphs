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

pub type OneRepMaxAlgorithm {
  Adams
  Baechle
  Berger
  Brown
  Brzycki
  Epley
  Kemmler
  Landers
  Lombardi
  Mayhew
  Naclerio
  Oconner
  Wathen
}

pub type User {
  User(
    id: UserId,
    name: Name,
    email: Email,
    password_hash: PasswordHash,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
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

pub fn one_rep_max_algorithm_to_string(
  algorithm: OneRepMaxAlgorithm,
) -> String {
  case algorithm {
    Adams -> "adams"
    Baechle -> "baechle"
    Berger -> "berger"
    Brown -> "brown"
    Brzycki -> "brzycki"
    Epley -> "epley"
    Kemmler -> "kemmler"
    Landers -> "landers"
    Lombardi -> "lombardi"
    Mayhew -> "mayhew"
    Naclerio -> "naclerio"
    Oconner -> "oconner"
    Wathen -> "wathen"
  }
}

pub fn parse_one_rep_max_algorithm() {
  form.parse(fn(input) {
    case input {
      ["adams", ..] -> Ok(Adams)
      ["baechle", ..] -> Ok(Baechle)
      ["berger", ..] -> Ok(Berger)
      ["brown", ..] -> Ok(Brown)
      ["brzycki", ..] -> Ok(Brzycki)
      ["epley", ..] -> Ok(Epley)
      ["kemmler", ..] -> Ok(Kemmler)
      ["landers", ..] -> Ok(Landers)
      ["lombardi", ..] -> Ok(Lombardi)
      ["mayhew", ..] -> Ok(Mayhew)
      ["naclerio", ..] -> Ok(Naclerio)
      ["oconner", ..] -> Ok(Oconner)
      ["wathen", ..] -> Ok(Wathen)
      _ -> Error(#(Epley, "must be a supported one rep max algorithm"))
    }
  })
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
