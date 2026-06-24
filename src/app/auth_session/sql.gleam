//// This module contains the code to run the sql queries defined in
//// `./src/app/auth_session/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_auth_session` query
/// defined in `./src/app/auth_session/sql/create_auth_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateAuthSessionRow {
  CreateAuthSessionRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    created_at: Timestamp,
    last_active_at: Timestamp,
  )
}

/// Runs the `create_auth_session` query
/// defined in `./src/app/auth_session/sql/create_auth_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
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
    use last_active_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(CreateAuthSessionRow(
      id:,
      user_id:,
      secret_hash:,
      created_at:,
      last_active_at:,
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

/// Runs the `delete_auth_session_by_id` query
/// defined in `./src/app/auth_session/sql/delete_auth_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_auth_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from auth_sessions where id = $1;



"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_auth_session_by_id` query
/// defined in `./src/app/auth_session/sql/select_auth_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectAuthSessionByIdRow {
  SelectAuthSessionByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    created_at: Timestamp,
    last_active_at: Timestamp,
    email_address: String,
    name: String,
    user_created_at: Timestamp,
  )
}

/// Runs the `select_auth_session_by_id` query
/// defined in `./src/app/auth_session/sql/select_auth_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_auth_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectAuthSessionByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use user_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use last_active_at <- decode.field(4, pog.timestamp_decoder())
    use email_address <- decode.field(5, decode.string)
    use name <- decode.field(6, decode.string)
    use user_created_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(SelectAuthSessionByIdRow(
      id:,
      user_id:,
      secret_hash:,
      created_at:,
      last_active_at:,
      email_address:,
      name:,
      user_created_at:,
    ))
  }

  "select
  s.id,
  s.user_id,
  s.secret_hash,
  s.created_at,
  s.last_active_at,
  u.email_address,
  u.name,
  u.created_at as user_created_at
from auth_sessions s
join users u on u.id = s.user_id
where s.id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `update_auth_session_last_active_at` query
/// defined in `./src/app/auth_session/sql/update_auth_session_last_active_at.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_auth_session_last_active_at(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update auth_sessions set last_active_at = now() where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
