//// This module contains the code to run the sql queries defined in
//// `./src/app/sign_up_session/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/sign_up_session/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `create` query
/// defined in `./src/app/sign_up_session/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: String,
  arg_3: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(CreateRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "insert into sign_up_sessions (
  secret_hash, email_address, email_address_verification_code 
) 
values 
  ($1, $2, $3)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
