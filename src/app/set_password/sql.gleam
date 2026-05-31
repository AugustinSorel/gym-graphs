//// This module contains the code to run the sql queries defined in
//// `./src/app/set_password/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_user` query
/// defined in `./src/app/set_password/sql/create_user.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateUserRow {
  CreateUserRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `create_user` query
/// defined in `./src/app/set_password/sql/create_user.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_user(
  db: pog.Connection,
  arg_1: String,
  arg_2: BitArray,
  arg_3: BitArray,
) -> Result(pog.Returned(CreateUserRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(CreateUserRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
    ))
  }

  "insert into users (email_address, password_hash, password_salt)
values ($1, $2, $3)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.parameter(pog.bytea(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
