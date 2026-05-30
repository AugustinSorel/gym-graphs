//// This module contains the code to run the sql queries defined in
//// `./src/app/verify_email_address/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `select_by_id` query
/// defined in `./src/app/verify_email_address/sql/select_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdRow {
  SelectByIdRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `select_by_id` query
/// defined in `./src/app/verify_email_address/sql/select_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectByIdRow), pog.QueryError) {
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
    decode.success(SelectByIdRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "select * from sign_up_sessions where id = $1 and created_at > now() - interval '24 hours';
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `set_account_as_verified` query
/// defined in `./src/app/verify_email_address/sql/set_account_as_verified.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SetAccountAsVerifiedRow {
  SetAccountAsVerifiedRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `set_account_as_verified` query
/// defined in `./src/app/verify_email_address/sql/set_account_as_verified.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn set_account_as_verified(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SetAccountAsVerifiedRow), pog.QueryError) {
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
    decode.success(SetAccountAsVerifiedRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "update 
  sign_up_sessions 
set 
  email_address_verified_at = now() 
where 
  id = $1 
  and email_address_verified_at is null 
returning 
  *;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
