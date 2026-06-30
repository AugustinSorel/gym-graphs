//// This module contains the code to run the sql queries defined in
//// `./src/app/password_reset/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/password_reset/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: BitArray,
    email_code_salt: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `create` query
/// defined in `./src/app/password_reset/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: BitArray,
  arg_3: BitArray,
  users_email_address: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use user_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use email_code_hash <- decode.field(3, decode.bit_array)
    use email_code_salt <- decode.field(4, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      5,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(CreateRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      email_code_salt:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "insert into password_reset_sessions (user_id, secret_hash, email_code_hash, email_code_salt)
select users.id, $1, $2, $3 from users
where users.email_address = $4
returning *
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.parameter(pog.bytea(arg_3))
  |> pog.parameter(pog.text(users_email_address))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete_by_id` query
/// defined in `./src/app/password_reset/sql/delete_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteByIdRow {
  DeleteByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: BitArray,
    email_code_salt: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `delete_by_id` query
/// defined in `./src/app/password_reset/sql/delete_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(DeleteByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use user_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use email_code_hash <- decode.field(3, decode.bit_array)
    use email_code_salt <- decode.field(4, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      5,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(DeleteByIdRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      email_code_salt:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "delete from password_reset_sessions where id = $1 returning *;

"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id` query
/// defined in `./src/app/password_reset/sql/select_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdRow {
  SelectByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: BitArray,
    email_code_salt: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `select_by_id` query
/// defined in `./src/app/password_reset/sql/select_by_id.sql`.
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
    use email_code_hash <- decode.field(3, decode.bit_array)
    use email_code_salt <- decode.field(4, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      5,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(SelectByIdRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      email_code_salt:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "select * from password_reset_sessions where id = $1 and created_at > now() - interval '1 hours';

"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `verify` query
/// defined in `./src/app/password_reset/sql/verify.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type VerifyRow {
  VerifyRow(id: Int)
}

/// Runs the `verify` query
/// defined in `./src/app/password_reset/sql/verify.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(VerifyRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(VerifyRow(id:))
  }

  "update password_reset_sessions
set user_identity_verified_at = now()
where id =
$1 and user_identity_verified_at is null
returning id

"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
