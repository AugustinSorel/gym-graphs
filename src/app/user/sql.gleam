//// This module contains the code to run the sql queries defined in
//// `./src/app/user/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_user` query
/// defined in `./src/app/user/sql/create_user.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateUserRow {
  CreateUserRow(id: Int, email_address: String)
}

/// Runs the `create_user` query
/// defined in `./src/app/user/sql/create_user.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_user(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: BitArray,
  id: Int,
) -> Result(pog.Returned(CreateUserRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    decode.success(CreateUserRow(id:, email_address:))
  }

  "insert into users (
  email_address, password_hash, 
  password_salt 
) 
select 
  email_address,
  $1,
  $2
from 
  sign_up_sessions 
where 
  id = $3 
  AND email_address_verified_at is not null 
returning 
  id, email_address
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete_user_by_account_deletion_session_id` query
/// defined in `./src/app/user/sql/delete_user_by_account_deletion_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteUserByAccountDeletionSessionIdRow {
  DeleteUserByAccountDeletionSessionIdRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `delete_user_by_account_deletion_session_id` query
/// defined in `./src/app/user/sql/delete_user_by_account_deletion_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_user_by_account_deletion_session_id(
  db: pog.Connection,
  account_deletion_sessions_id: Int,
) -> Result(
  pog.Returned(DeleteUserByAccountDeletionSessionIdRow),
  pog.QueryError,
) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(DeleteUserByAccountDeletionSessionIdRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
    ))
  }

  "delete from users
where id in (
    select auth_sessions.user_id
    from auth_sessions
    inner join account_deletion_sessions
        on auth_sessions.id = account_deletion_sessions.auth_session_id
    where account_deletion_sessions.id = $1
    and account_deletion_sessions.user_identity_verified_at is not null
)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(account_deletion_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_user_by_email_address` query
/// defined in `./src/app/user/sql/select_user_by_email_address.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByEmailAddressRow {
  SelectUserByEmailAddressRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `select_user_by_email_address` query
/// defined in `./src/app/user/sql/select_user_by_email_address.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_user_by_email_address(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(SelectUserByEmailAddressRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(SelectUserByEmailAddressRow(
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

/// A row you get from running the `select_user_by_id` query
/// defined in `./src/app/user/sql/select_user_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByIdRow {
  SelectUserByIdRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
  )
}

/// Runs the `select_user_by_id` query
/// defined in `./src/app/user/sql/select_user_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_user_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectUserByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(SelectUserByIdRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
    ))
  }

  "select * from users where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
