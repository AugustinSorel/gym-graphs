//// This module contains the code to run the sql queries defined in
//// `./src/app/auth_session/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_auth_session` query
/// defined in `./src/app/auth_session/sql/create_auth_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateAuthSessionRow {
  CreateAuthSessionRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `create_auth_session` query
/// defined in `./src/app/auth_session/sql/create_auth_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_auth_session(
  db: pog.Connection,
  arg_1: Int,
  arg_2: BitArray,
) -> Result(pog.Returned(CreateAuthSessionRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use user_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    decode.success(CreateAuthSessionRow(
      id:,
      user_id:,
      secret_hash:,
      created_at:,
    ))
  }

  "insert into auth_sessions (user_id, secret_hash) values ($1, $2) returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
