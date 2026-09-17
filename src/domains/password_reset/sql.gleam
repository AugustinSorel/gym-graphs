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

/// Runs the `delete_by_id` query
/// defined in `./src/domains/password_reset/sql/delete_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from password_reset_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id` query
/// defined in `./src/domains/password_reset/sql/select_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdRow {
  SelectByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: String,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_by_id` query
/// defined in `./src/domains/password_reset/sql/select_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(SelectByIdRow), pog.QueryError) {
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
    decode.success(SelectByIdRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from password_reset_sessions where id = $1 and created_at > now() - interval '1 hours';
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `verify` query
/// defined in `./src/domains/password_reset/sql/verify.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update password_reset_sessions
set user_identity_verified_at = now()
where id =
$1 and user_identity_verified_at is null;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
