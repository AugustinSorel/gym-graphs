//// This module contains the code to run the sql queries defined in
//// `./src/app/password_update/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_password_update_session` query
/// defined in `./src/app/password_update/sql/create_password_update_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreatePasswordUpdateSessionRow {
  CreatePasswordUpdateSessionRow(
    id: Int,
    auth_session_id: Int,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `create_password_update_session` query
/// defined in `./src/app/password_update/sql/create_password_update_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_password_update_session(
  db: pog.Connection,
  arg_1: Int,
  arg_2: BitArray,
) -> Result(pog.Returned(CreatePasswordUpdateSessionRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use auth_session_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      3,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(CreatePasswordUpdateSessionRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "insert into password_update_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `delete_password_update_session_by_id` query
/// defined in `./src/app/password_update/sql/delete_password_update_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_password_update_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from password_update_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_password_update_session_by_id` query
/// defined in `./src/app/password_update/sql/select_password_update_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectPasswordUpdateSessionByIdRow {
  SelectPasswordUpdateSessionByIdRow(
    id: Int,
    auth_session_id: Int,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `select_password_update_session_by_id` query
/// defined in `./src/app/password_update/sql/select_password_update_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_password_update_session_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(SelectPasswordUpdateSessionByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use auth_session_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      3,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(SelectPasswordUpdateSessionByIdRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "select * from password_update_sessions where id = $1 and created_at > now() - interval '1 hours';
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `set_identity_verified_to_now` query
/// defined in `./src/app/password_update/sql/set_identity_verified_to_now.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SetIdentityVerifiedToNowRow {
  SetIdentityVerifiedToNowRow(
    id: Int,
    auth_session_id: Int,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `set_identity_verified_to_now` query
/// defined in `./src/app/password_update/sql/set_identity_verified_to_now.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn set_identity_verified_to_now(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(SetIdentityVerifiedToNowRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use auth_session_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      3,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(SetIdentityVerifiedToNowRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "update password_update_sessions set user_identity_verified_at = now() where id = $1 and user_identity_verified_at is null returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_user_password_by_password_update_session_id` query
/// defined in `./src/app/password_update/sql/update_user_password_by_password_update_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateUserPasswordByPasswordUpdateSessionIdRow {
  UpdateUserPasswordByPasswordUpdateSessionIdRow(id: Int)
}

/// Runs the `update_user_password_by_password_update_session_id` query
/// defined in `./src/app/password_update/sql/update_user_password_by_password_update_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_password_by_password_update_session_id(
  db: pog.Connection,
  arg_1: BitArray,
  password_salt: BitArray,
  password_update_sessions_id: Int,
) -> Result(
  pog.Returned(UpdateUserPasswordByPasswordUpdateSessionIdRow),
  pog.QueryError,
) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdateUserPasswordByPasswordUpdateSessionIdRow(id:))
  }

  "update users
set
    password_hash = $1,
    password_salt = $2
from auth_sessions
join password_update_sessions on password_update_sessions.auth_session_id = auth_sessions.id
where users.id = auth_sessions.user_id
  and auth_sessions.id = password_update_sessions.auth_session_id
  and password_update_sessions.id = $3
  and password_update_sessions.user_identity_verified_at is not null
returning users.id;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(password_salt))
  |> pog.parameter(pog.int(password_update_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
