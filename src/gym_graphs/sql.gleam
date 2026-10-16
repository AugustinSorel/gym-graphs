//// This module contains the code to run the sql queries defined in
//// `./src/gym_graphs/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog

/// A row you get from running the `create_sign_up_session` query
/// defined in `./src/gym_graphs/sql/create_sign_up_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateSignUpSessionRow {
  CreateSignUpSessionRow(id: Int)
}

/// Runs the `create_sign_up_session` query
/// defined in `./src/gym_graphs/sql/create_sign_up_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_sign_up_session(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: String,
  arg_3: String,
) -> Result(pog.Returned(CreateSignUpSessionRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(CreateSignUpSessionRow(id:))
  }

  "insert into sign_up_sessions (
  secret_hash, email_address, email_address_verification_code 
) 
values 
  ($1, $2, $3)
returning id;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
