//// This module contains the code to run the sql queries defined in
//// `./src/domains/user/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `check_email_availability` query
/// defined in `./src/domains/user/sql/check_email_availability.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CheckEmailAvailabilityRow {
  CheckEmailAvailabilityRow(exists: Int)
}

/// Runs the `check_email_availability` query
/// defined in `./src/domains/user/sql/check_email_availability.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn check_email_availability(
  db: pog.Connection,
  email_address: String,
) -> Result(pog.Returned(CheckEmailAvailabilityRow), pog.QueryError) {
  let decoder = {
    use exists <- decode.field(0, decode.int)
    decode.success(CheckEmailAvailabilityRow(exists:))
  }

  "select 1 as exists from users  where email_address = $1 limit 1;
"
  |> pog.query
  |> pog.parameter(pog.text(email_address))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create` query
/// defined in `./src/domains/user/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, email_address: String)
}

/// Runs the `create` query
/// defined in `./src/domains/user/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: BitArray,
  arg_3: String,
  id: Int,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    decode.success(CreateRow(id:, email_address:))
  }

  "insert into users (email_address, password_hash, password_salt, name)
select
    email_address,
    $1,
    $2,
    $3
from sign_up_sessions
where id = $4 and email_address_verified_at is not null returning
    id, email_address
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_email` query
/// defined in `./src/domains/user/sql/select_by_email.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByEmailRow {
  SelectByEmailRow(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_by_email` query
/// defined in `./src/domains/user/sql/select_by_email.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_email(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(SelectByEmailRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use name <- decode.field(2, decode.string)
    use weight_unit <- decode.field(3, weight_unit_decoder())
    use one_rep_max_algorithm <- decode.field(
      4,
      one_rep_max_algorithm_decoder(),
    )
    use password_hash <- decode.field(5, decode.bit_array)
    use password_salt <- decode.field(6, decode.bit_array)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    use updated_at <- decode.field(8, pog.timestamp_decoder())
    decode.success(SelectByEmailRow(
      id:,
      email_address:,
      name:,
      weight_unit:,
      one_rep_max_algorithm:,
      password_hash:,
      password_salt:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from users where email_address = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `one_rep_max_algorithm` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type OneRepMaxAlgorithm {
  Wathen
  Oconner
  Naclerio
  Mayhew
  Lombardi
  Landers
  Kemmler
  Epley
  Brzycki
  Brown
  Berger
  Baechle
  Adams
}

fn one_rep_max_algorithm_decoder() -> decode.Decoder(OneRepMaxAlgorithm) {
  use one_rep_max_algorithm <- decode.then(decode.string)
  case one_rep_max_algorithm {
    "wathen" -> decode.success(Wathen)
    "oconner" -> decode.success(Oconner)
    "naclerio" -> decode.success(Naclerio)
    "mayhew" -> decode.success(Mayhew)
    "lombardi" -> decode.success(Lombardi)
    "landers" -> decode.success(Landers)
    "kemmler" -> decode.success(Kemmler)
    "epley" -> decode.success(Epley)
    "brzycki" -> decode.success(Brzycki)
    "brown" -> decode.success(Brown)
    "berger" -> decode.success(Berger)
    "baechle" -> decode.success(Baechle)
    "adams" -> decode.success(Adams)
    _ -> decode.failure(Wathen, "OneRepMaxAlgorithm")
  }
}

/// Corresponds to the Postgres `weight_unit` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type WeightUnit {
  Lbs
  Kg
}

fn weight_unit_decoder() -> decode.Decoder(WeightUnit) {
  use weight_unit <- decode.then(decode.string)
  case weight_unit {
    "lbs" -> decode.success(Lbs)
    "kg" -> decode.success(Kg)
    _ -> decode.failure(Lbs, "WeightUnit")
  }
}
