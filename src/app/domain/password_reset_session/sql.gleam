//// This module contains the code to run the sql queries defined in
//// `./src/app/domain/password_reset_session/sql`.
//// > 🐿️ This module was generated automatically using v4.6.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_password_reset_session` query
/// defined in `./src/app/domain/password_reset_session/sql/create_password_reset_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreatePasswordResetSessionRow {
  CreatePasswordResetSessionRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: BitArray,
    email_code_salt: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `create_password_reset_session` query
/// defined in `./src/app/domain/password_reset_session/sql/create_password_reset_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_password_reset_session(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: BitArray,
  arg_3: BitArray,
  arg_4: String,
) -> Result(pog.Returned(CreatePasswordResetSessionRow), pog.QueryError) {
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
    decode.success(CreatePasswordResetSessionRow(
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
  |> pog.parameter(pog.text(arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_password_reset_session_by_id` query
/// defined in `./src/app/domain/password_reset_session/sql/select_password_reset_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectPasswordResetSessionByIdRow {
  SelectPasswordResetSessionByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: BitArray,
    email_code_salt: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `select_password_reset_session_by_id` query
/// defined in `./src/app/domain/password_reset_session/sql/select_password_reset_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_password_reset_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectPasswordResetSessionByIdRow), pog.QueryError) {
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
    decode.success(SelectPasswordResetSessionByIdRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      email_code_salt:,
      user_identity_verified_at:,
      created_at:,
    ))
  }

  "select * from password_reset_sessions where id = $1 and created_at > now() - interval '24 hours';

"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `set_user_identity_verified_at_to_now` query.
///
pub type SetUserIdentityVerifiedAtToNowRow {
  SetUserIdentityVerifiedAtToNowRow(id: Int)
}

/// Runs the `set_user_identity_verified_at_to_now` query.
///
pub fn set_user_identity_verified_at_to_now(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SetUserIdentityVerifiedAtToNowRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(SetUserIdentityVerifiedAtToNowRow(id:))
  }

  "update password_reset_sessions
set user_identity_verified_at = now()
where id = $1 and user_identity_verified_at is null
returning id;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_user_by_password_reset_session_id` query
/// defined in `./src/app/domain/password_reset_session/sql/select_user_by_password_reset_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.6.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByPasswordResetSessionIdRow {
  SelectUserByPasswordResetSessionIdRow(email_address: String)
}

/// Runs the `select_user_by_password_reset_session_id` query
/// defined in `./src/app/domain/password_reset_session/sql/select_user_by_password_reset_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.6.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_user_by_password_reset_session_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectUserByPasswordResetSessionIdRow), pog.QueryError) {
  let decoder = {
    use email_address <- decode.field(0, decode.string)
    decode.success(SelectUserByPasswordResetSessionIdRow(email_address:))
  }

  "select users.email_address
from password_reset_sessions
inner join users on password_reset_sessions.user_id = users.id
where password_reset_sessions.id
=
$1;



"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
