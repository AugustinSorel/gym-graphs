//// This module contains the code to run the sql queries defined in
//// `./src/app/user/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `select_by_email_address` query
/// defined in `./src/app/user/sql/select_by_email_address.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByEmailAddressRow {
  SelectByEmailAddressRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `select_by_email_address` query
/// defined in `./src/app/user/sql/select_by_email_address.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_email_address(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(SelectByEmailAddressRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(SelectByEmailAddressRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
    ))
  }

  "select * from users where email_address = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
