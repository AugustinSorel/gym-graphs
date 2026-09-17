//// This module contains the code to run the sql queries defined in
//// `./src/domains/password_reset/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/domains/password_reset/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: String,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `create` query
/// defined in `./src/domains/password_reset/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: String,
  users_email_address: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use user_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use email_code_hash <- decode.field(3, decode.string)
    use user_identity_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(CreateRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "insert into password_reset_sessions (user_id, secret_hash, email_code_hash)
select users.id, $1, $2 from users
where users.email_address = $3
returning *
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(users_email_address))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
