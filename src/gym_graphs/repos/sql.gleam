//// This module contains the code to run the sql queries defined in
//// `./src/gym_graphs/repos/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `count_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/count_tags_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CountTagsByUserIdRow {
  CountTagsByUserIdRow(total_count: Int)
}

/// Runs the `count_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/count_tags_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn count_tags_by_user_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(CountTagsByUserIdRow), pog.QueryError) {
  let decoder = {
    use total_count <- decode.field(0, decode.int)
    decode.success(CountTagsByUserIdRow(total_count:))
  }

  "select count(*)::int as total_count
from tags
where user_id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_account_deletion_session` query
/// defined in `./src/gym_graphs/repos/sql/create_account_deletion_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateAccountDeletionSessionRow {
  CreateAccountDeletionSessionRow(
    id: Int,
    auth_session_id: Int,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `create_account_deletion_session` query
/// defined in `./src/gym_graphs/repos/sql/create_account_deletion_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_account_deletion_session(
  db: pog.Connection,
  arg_1: Int,
  arg_2: BitArray,
) -> Result(pog.Returned(CreateAccountDeletionSessionRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use auth_session_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      3,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(CreateAccountDeletionSessionRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "insert into account_deletion_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_auth_session` query
/// defined in `./src/gym_graphs/repos/sql/create_auth_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateAuthSessionRow {
  CreateAuthSessionRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    last_active_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `create_auth_session` query
/// defined in `./src/gym_graphs/repos/sql/create_auth_session.sql`.
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
    use last_active_at <- decode.field(3, pog.timestamp_decoder())
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(CreateAuthSessionRow(
      id:,
      user_id:,
      secret_hash:,
      last_active_at:,
      created_at:,
      updated_at:,
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

/// A row you get from running the `create_password_reset_session` query
/// defined in `./src/gym_graphs/repos/sql/create_password_reset_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreatePasswordResetSessionRow {
  CreatePasswordResetSessionRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: String,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `create_password_reset_session` query
/// defined in `./src/gym_graphs/repos/sql/create_password_reset_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_password_reset_session(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: String,
  users_email_address: String,
) -> Result(pog.Returned(CreatePasswordResetSessionRow), pog.QueryError) {
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
    decode.success(CreatePasswordResetSessionRow(
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
returning *;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(users_email_address))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_password_update_session` query
/// defined in `./src/gym_graphs/repos/sql/create_password_update_session.sql`.
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
    updated_at: Timestamp,
  )
}

/// Runs the `create_password_update_session` query
/// defined in `./src/gym_graphs/repos/sql/create_password_update_session.sql`.
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
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(CreatePasswordUpdateSessionRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "insert into password_update_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_sign_up_session` query
/// defined in `./src/gym_graphs/repos/sql/create_sign_up_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateSignUpSessionRow {
  CreateSignUpSessionRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `create_sign_up_session` query
/// defined in `./src/gym_graphs/repos/sql/create_sign_up_session.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_sign_up_session(
  db: pog.Connection,
  arg_1: BitArray,
  email_address: String,
  arg_3: String,
) -> Result(pog.Returned(CreateSignUpSessionRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(CreateSignUpSessionRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "insert into sign_up_sessions (
    secret_hash,
    email_address,
    email_address_verification_code
)
select
    $1,
    $2,
    $3
where not exists (
    select 1
    from users
    where email_address = $2
)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(email_address))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_tag` query
/// defined in `./src/gym_graphs/repos/sql/create_tag.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateTagRow {
  CreateTagRow(id: Int)
}

/// Runs the `create_tag` query
/// defined in `./src/gym_graphs/repos/sql/create_tag.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_tag(
  db: pog.Connection,
  arg_1: Int,
  arg_2: String,
) -> Result(pog.Returned(CreateTagRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(CreateTagRow(id:))
  }

  "insert into tags (user_id, name)
values ($1, $2)
returning id;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_user` query
/// defined in `./src/gym_graphs/repos/sql/create_user.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateUserRow {
  CreateUserRow(id: Int, email_address: String)
}

/// Runs the `create_user` query
/// defined in `./src/gym_graphs/repos/sql/create_user.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_user(
  db: pog.Connection,
  arg_1: String,
  arg_2: String,
  id: Int,
) -> Result(pog.Returned(CreateUserRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    decode.success(CreateUserRow(id:, email_address:))
  }

  "insert into users (email_address, password_hash, name)
select
    email_address,
    $1,
    $2
from sign_up_sessions
where id = $3 and email_address_verified_at is not null returning
    id, email_address;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `delete_account_deletion_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_account_deletion_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_account_deletion_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from account_deletion_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `delete_auth_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_auth_session_by_id.sql`.
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

/// Runs the `delete_password_reset_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_password_reset_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_password_reset_session_by_id(
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

/// Runs the `delete_password_update_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_password_update_session_by_id.sql`.
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

/// Runs the `delete_sign_up_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_sign_up_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_sign_up_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from sign_up_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete_tag_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_tag_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteTagByIdAndUserIdRow {
  DeleteTagByIdAndUserIdRow(id: Int)
}

/// Runs the `delete_tag_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_tag_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_tag_by_id_and_user_id(
  db: pog.Connection,
  id: Int,
  user_id: Int,
) -> Result(pog.Returned(DeleteTagByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(DeleteTagByIdAndUserIdRow(id:))
  }

  "delete from tags
where id = $1 and user_id = $2
returning id;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `delete_user_by_account_deletion_session_id` query
/// defined in `./src/gym_graphs/repos/sql/delete_user_by_account_deletion_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_user_by_account_deletion_session_id(
  db: pog.Connection,
  account_deletion_sessions_id: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from users
where id in (
  select auth_sessions.user_id
  from auth_sessions
  inner join account_deletion_sessions
    on auth_sessions.id = account_deletion_sessions.auth_session_id
  where account_deletion_sessions.id = $1
    and account_deletion_sessions.user_identity_verified_at is not null
);
"
  |> pog.query
  |> pog.parameter(pog.int(account_deletion_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `refresh_auth_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/refresh_auth_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn refresh_auth_session_by_id(
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

/// A row you get from running the `select_account_deletion_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_account_deletion_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectAccountDeletionSessionByIdRow {
  SelectAccountDeletionSessionByIdRow(
    id: Int,
    auth_session_id: Int,
    secret_hash: BitArray,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_account_deletion_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_account_deletion_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_account_deletion_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectAccountDeletionSessionByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use auth_session_id <- decode.field(1, decode.int)
    use secret_hash <- decode.field(2, decode.bit_array)
    use user_identity_verified_at <- decode.field(
      3,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(SelectAccountDeletionSessionByIdRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from account_deletion_sessions
where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_auth_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_auth_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectAuthSessionByIdRow {
  SelectAuthSessionByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    last_active_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_auth_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_auth_session_by_id.sql`.
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
    use last_active_at <- decode.field(3, pog.timestamp_decoder())
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(SelectAuthSessionByIdRow(
      id:,
      user_id:,
      secret_hash:,
      last_active_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from auth_sessions s where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_export_account_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_account_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectExportAccountByUserIdRow {
  SelectExportAccountByUserIdRow(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_export_account_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_account_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_export_account_by_user_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectExportAccountByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use name <- decode.field(2, decode.string)
    use weight_unit <- decode.field(3, weight_unit_decoder())
    use one_rep_max_algorithm <- decode.field(
      4,
      one_rep_max_algorithm_decoder(),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(SelectExportAccountByUserIdRow(
      id:,
      email_address:,
      name:,
      weight_unit:,
      one_rep_max_algorithm:,
      created_at:,
      updated_at:,
    ))
  }

  "select
    id,
    email_address,
    name,
    weight_unit,
    one_rep_max_algorithm,
    created_at,
    updated_at
from users
where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_export_exercise_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_exercise_tags_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectExportExerciseTagsByUserIdRow {
  SelectExportExerciseTagsByUserIdRow(
    exercise_id: Int,
    tag_id: Int,
    created_at: Timestamp,
  )
}

/// Runs the `select_export_exercise_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_exercise_tags_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_export_exercise_tags_by_user_id(
  db: pog.Connection,
  exercises_user_id: Int,
) -> Result(pog.Returned(SelectExportExerciseTagsByUserIdRow), pog.QueryError) {
  let decoder = {
    use exercise_id <- decode.field(0, decode.int)
    use tag_id <- decode.field(1, decode.int)
    use created_at <- decode.field(2, pog.timestamp_decoder())
    decode.success(SelectExportExerciseTagsByUserIdRow(
      exercise_id:,
      tag_id:,
      created_at:,
    ))
  }

  "select exercise_tags.exercise_id, exercise_tags.tag_id, exercise_tags.created_at
from exercise_tags
inner join exercises on exercises.id = exercise_tags.exercise_id
inner join tags on tags.id = exercise_tags.tag_id
where exercises.user_id = $1 and tags.user_id = $1
order by exercise_tags.exercise_id, exercise_tags.tag_id;
"
  |> pog.query
  |> pog.parameter(pog.int(exercises_user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_export_exercises_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_exercises_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectExportExercisesByUserIdRow {
  SelectExportExercisesByUserIdRow(
    id: Int,
    name: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_export_exercises_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_exercises_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_export_exercises_by_user_id(
  db: pog.Connection,
  user_id: Int,
) -> Result(pog.Returned(SelectExportExercisesByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    use created_at <- decode.field(2, pog.timestamp_decoder())
    use updated_at <- decode.field(3, pog.timestamp_decoder())
    decode.success(SelectExportExercisesByUserIdRow(
      id:,
      name:,
      created_at:,
      updated_at:,
    ))
  }

  "select id, name, created_at, updated_at
from exercises
where user_id = $1
order by id;
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_export_sets_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_sets_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectExportSetsByUserIdRow {
  SelectExportSetsByUserIdRow(
    id: Int,
    exercise_id: Int,
    repetitions: Int,
    weight_in_g: Int,
    done_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_export_sets_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_sets_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_export_sets_by_user_id(
  db: pog.Connection,
  exercises_user_id: Int,
) -> Result(pog.Returned(SelectExportSetsByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use exercise_id <- decode.field(1, decode.int)
    use repetitions <- decode.field(2, decode.int)
    use weight_in_g <- decode.field(3, decode.int)
    use done_at <- decode.field(4, pog.timestamp_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(SelectExportSetsByUserIdRow(
      id:,
      exercise_id:,
      repetitions:,
      weight_in_g:,
      done_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select
    sets.id,
    sets.exercise_id,
    sets.repetitions,
    sets.weight_in_g,
    sets.done_at,
    sets.created_at,
    sets.updated_at
from sets
inner join exercises on exercises.id = sets.exercise_id
where exercises.user_id = $1
order by sets.done_at, sets.id;
"
  |> pog.query
  |> pog.parameter(pog.int(exercises_user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_export_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_tags_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectExportTagsByUserIdRow {
  SelectExportTagsByUserIdRow(
    id: Int,
    name: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_export_tags_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_export_tags_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_export_tags_by_user_id(
  db: pog.Connection,
  user_id: Int,
) -> Result(pog.Returned(SelectExportTagsByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    use created_at <- decode.field(2, pog.timestamp_decoder())
    use updated_at <- decode.field(3, pog.timestamp_decoder())
    decode.success(SelectExportTagsByUserIdRow(
      id:,
      name:,
      created_at:,
      updated_at:,
    ))
  }

  "select id, name, created_at, updated_at
from tags
where user_id = $1
order by id;
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_password_reset_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_password_reset_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectPasswordResetSessionByIdRow {
  SelectPasswordResetSessionByIdRow(
    id: Int,
    user_id: Int,
    secret_hash: BitArray,
    email_code_hash: String,
    user_identity_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_password_reset_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_password_reset_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
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
    use email_code_hash <- decode.field(3, decode.string)
    use user_identity_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(SelectPasswordResetSessionByIdRow(
      id:,
      user_id:,
      secret_hash:,
      email_code_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from password_reset_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_password_update_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_password_update_session_by_id.sql`.
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
    updated_at: Timestamp,
  )
}

/// Runs the `select_password_update_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_password_update_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_password_update_session_by_id(
  db: pog.Connection,
  arg_1: Int,
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
    use updated_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(SelectPasswordUpdateSessionByIdRow(
      id:,
      auth_session_id:,
      secret_hash:,
      user_identity_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from password_update_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_sign_up_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_sign_up_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectSignUpSessionByIdRow {
  SelectSignUpSessionByIdRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_sign_up_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_sign_up_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_sign_up_session_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectSignUpSessionByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(SelectSignUpSessionByIdRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from sign_up_sessions where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_tag_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_tag_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectTagByIdAndUserIdRow {
  SelectTagByIdAndUserIdRow(id: Int, name: String)
}

/// Runs the `select_tag_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_tag_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_tag_by_id_and_user_id(
  db: pog.Connection,
  id: Int,
  arg_2: Int,
) -> Result(pog.Returned(SelectTagByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectTagByIdAndUserIdRow(id:, name:))
  }

  "select id, name
from tags
where id = $1 and user_id = $2;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_tags_page_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_tags_page_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectTagsPageByUserIdRow {
  SelectTagsPageByUserIdRow(id: Int, name: String)
}

/// Runs the `select_tags_page_by_user_id` query
/// defined in `./src/gym_graphs/repos/sql/select_tags_page_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_tags_page_by_user_id(
  db: pog.Connection,
  user_id: Int,
  arg_2: Int,
  arg_3: Int,
) -> Result(pog.Returned(SelectTagsPageByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectTagsPageByUserIdRow(id:, name:))
  }

  "select id, name
from tags
where user_id = $1 and id > $2
order by id
limit $3;
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.int(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_user_by_email` query
/// defined in `./src/gym_graphs/repos/sql/select_user_by_email.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByEmailRow {
  SelectUserByEmailRow(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
    password_hash: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_user_by_email` query
/// defined in `./src/gym_graphs/repos/sql/select_user_by_email.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_user_by_email(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(SelectUserByEmailRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use name <- decode.field(2, decode.string)
    use weight_unit <- decode.field(3, weight_unit_decoder())
    use one_rep_max_algorithm <- decode.field(
      4,
      one_rep_max_algorithm_decoder(),
    )
    use password_hash <- decode.field(5, decode.string)
    use created_at <- decode.field(6, pog.timestamp_decoder())
    use updated_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(SelectUserByEmailRow(
      id:,
      email_address:,
      name:,
      weight_unit:,
      one_rep_max_algorithm:,
      password_hash:,
      created_at:,
      updated_at:,
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
/// defined in `./src/gym_graphs/repos/sql/select_user_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByIdRow {
  SelectUserByIdRow(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
    password_hash: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_user_by_id` query
/// defined in `./src/gym_graphs/repos/sql/select_user_by_id.sql`.
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
    use name <- decode.field(2, decode.string)
    use weight_unit <- decode.field(3, weight_unit_decoder())
    use one_rep_max_algorithm <- decode.field(
      4,
      one_rep_max_algorithm_decoder(),
    )
    use password_hash <- decode.field(5, decode.string)
    use created_at <- decode.field(6, pog.timestamp_decoder())
    use updated_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(SelectUserByIdRow(
      id:,
      email_address:,
      name:,
      weight_unit:,
      one_rep_max_algorithm:,
      password_hash:,
      created_at:,
      updated_at:,
    ))
  }

  "select * from users where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_user_by_password_reset_session_id` query
/// defined in `./src/gym_graphs/repos/sql/select_user_by_password_reset_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectUserByPasswordResetSessionIdRow {
  SelectUserByPasswordResetSessionIdRow(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
    password_hash: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// Runs the `select_user_by_password_reset_session_id` query
/// defined in `./src/gym_graphs/repos/sql/select_user_by_password_reset_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_user_by_password_reset_session_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectUserByPasswordResetSessionIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use name <- decode.field(2, decode.string)
    use weight_unit <- decode.field(3, weight_unit_decoder())
    use one_rep_max_algorithm <- decode.field(
      4,
      one_rep_max_algorithm_decoder(),
    )
    use password_hash <- decode.field(5, decode.string)
    use created_at <- decode.field(6, pog.timestamp_decoder())
    use updated_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(SelectUserByPasswordResetSessionIdRow(
      id:,
      email_address:,
      name:,
      weight_unit:,
      one_rep_max_algorithm:,
      password_hash:,
      created_at:,
      updated_at:,
    ))
  }

  "select users.*
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

/// Runs the `set_transaction_repeatable_read` query
/// defined in `./src/gym_graphs/repos/sql/set_transaction_repeatable_read.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn set_transaction_repeatable_read(
  db: pog.Connection,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "set transaction isolation level repeatable read;
"
  |> pog.query
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_tag_name_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/update_tag_name_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateTagNameByIdAndUserIdRow {
  UpdateTagNameByIdAndUserIdRow(id: Int)
}

/// Runs the `update_tag_name_by_id_and_user_id` query
/// defined in `./src/gym_graphs/repos/sql/update_tag_name_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_tag_name_by_id_and_user_id(
  db: pog.Connection,
  id: Int,
  user_id: Int,
  name: String,
) -> Result(pog.Returned(UpdateTagNameByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdateTagNameByIdAndUserIdRow(id:))
  }

  "update tags
set name = $3
where id = $1 and user_id = $2
returning id;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(name))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `update_user_name_by_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_name_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_name_by_id(
  db: pog.Connection,
  name: String,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update users set name = $1 where id = $2;
"
  |> pog.query
  |> pog.parameter(pog.text(name))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `update_user_one_rep_max_algorithm_by_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_one_rep_max_algorithm_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_one_rep_max_algorithm_by_id(
  db: pog.Connection,
  one_rep_max_algorithm: OneRepMaxAlgorithm,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update users set one_rep_max_algorithm = $1 where id = $2;
"
  |> pog.query
  |> pog.parameter(one_rep_max_algorithm_encoder(one_rep_max_algorithm))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_user_password_hash_by_password_reset_session_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_password_hash_by_password_reset_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateUserPasswordHashByPasswordResetSessionIdRow {
  UpdateUserPasswordHashByPasswordResetSessionIdRow(id: Int)
}

/// Runs the `update_user_password_hash_by_password_reset_session_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_password_hash_by_password_reset_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_password_hash_by_password_reset_session_id(
  db: pog.Connection,
  password_hash: String,
  password_reset_sessions_id: Int,
) -> Result(
  pog.Returned(UpdateUserPasswordHashByPasswordResetSessionIdRow),
  pog.QueryError,
) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdateUserPasswordHashByPasswordResetSessionIdRow(id:))
  }

  "update users
set
  password_hash = $1
from password_reset_sessions
where users.id = password_reset_sessions.user_id
and password_reset_sessions.id = $2
and password_reset_sessions.user_identity_verified_at is not null
returning password_reset_sessions.id;
"
  |> pog.query
  |> pog.parameter(pog.text(password_hash))
  |> pog.parameter(pog.int(password_reset_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_user_password_hash_by_password_update_session_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_password_hash_by_password_update_session_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateUserPasswordHashByPasswordUpdateSessionIdRow {
  UpdateUserPasswordHashByPasswordUpdateSessionIdRow(id: Int)
}

/// Runs the `update_user_password_hash_by_password_update_session_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_password_hash_by_password_update_session_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_password_hash_by_password_update_session_id(
  db: pog.Connection,
  password_hash: String,
  password_update_sessions_id: Int,
) -> Result(
  pog.Returned(UpdateUserPasswordHashByPasswordUpdateSessionIdRow),
  pog.QueryError,
) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdateUserPasswordHashByPasswordUpdateSessionIdRow(id:))
  }

  "update users
set
    password_hash = $1
from auth_sessions
join password_update_sessions on password_update_sessions.auth_session_id = auth_sessions.id
where users.id = auth_sessions.user_id
  and auth_sessions.id = password_update_sessions.auth_session_id
  and password_update_sessions.id = $2
  and password_update_sessions.user_identity_verified_at is not null
returning users.id;
"
  |> pog.query
  |> pog.parameter(pog.text(password_hash))
  |> pog.parameter(pog.int(password_update_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `update_user_weight_unit_by_id` query
/// defined in `./src/gym_graphs/repos/sql/update_user_weight_unit_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_user_weight_unit_by_id(
  db: pog.Connection,
  weight_unit: WeightUnit,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update users set weight_unit = $1 where id = $2;
"
  |> pog.query
  |> pog.parameter(weight_unit_encoder(weight_unit))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `verify_account_deletion_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/verify_account_deletion_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify_account_deletion_session_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update account_deletion_sessions
set user_identity_verified_at = now()
where id = $1 and user_identity_verified_at is null;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `verify_password_reset_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/verify_password_reset_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify_password_reset_session_by_id(
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

/// Runs the `verify_password_update_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/verify_password_update_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify_password_update_session_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update password_update_sessions
set user_identity_verified_at = now()
where id = $1 and user_identity_verified_at is null;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `verify_sign_up_session_by_id` query
/// defined in `./src/gym_graphs/repos/sql/verify_sign_up_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn verify_sign_up_session_by_id(
  db: pog.Connection,
  id: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "update 
  sign_up_sessions 
set 
  email_address_verified_at = now() 
where 
  id = $1 
  and email_address_verified_at is null;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `one_rep_max_algorithm` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type OneRepMaxAlgorithm {
  Wathen
  Oconner
  Naclerio
  Mayhew
  Lombardi
  Landers
  Kemmler
  Epley
  Brzycki
  Brown
  Berger
  Baechle
  Adams
}

fn one_rep_max_algorithm_decoder() -> decode.Decoder(OneRepMaxAlgorithm) {
  use one_rep_max_algorithm <- decode.then(decode.string)
  case one_rep_max_algorithm {
    "wathen" -> decode.success(Wathen)
    "oconner" -> decode.success(Oconner)
    "naclerio" -> decode.success(Naclerio)
    "mayhew" -> decode.success(Mayhew)
    "lombardi" -> decode.success(Lombardi)
    "landers" -> decode.success(Landers)
    "kemmler" -> decode.success(Kemmler)
    "epley" -> decode.success(Epley)
    "brzycki" -> decode.success(Brzycki)
    "brown" -> decode.success(Brown)
    "berger" -> decode.success(Berger)
    "baechle" -> decode.success(Baechle)
    "adams" -> decode.success(Adams)
    _ -> decode.failure(Wathen, "OneRepMaxAlgorithm")
  }
}

fn one_rep_max_algorithm_encoder(one_rep_max_algorithm) -> pog.Value {
  case one_rep_max_algorithm {
    Wathen -> "wathen"
    Oconner -> "oconner"
    Naclerio -> "naclerio"
    Mayhew -> "mayhew"
    Lombardi -> "lombardi"
    Landers -> "landers"
    Kemmler -> "kemmler"
    Epley -> "epley"
    Brzycki -> "brzycki"
    Brown -> "brown"
    Berger -> "berger"
    Baechle -> "baechle"
    Adams -> "adams"
  }
  |> pog.text
}

/// Corresponds to the Postgres `weight_unit` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type WeightUnit {
  Lbs
  Kg
}

fn weight_unit_decoder() -> decode.Decoder(WeightUnit) {
  use weight_unit <- decode.then(decode.string)
  case weight_unit {
    "lbs" -> decode.success(Lbs)
    "kg" -> decode.success(Kg)
    _ -> decode.failure(Lbs, "WeightUnit")
  }
}

fn weight_unit_encoder(weight_unit) -> pog.Value {
  case weight_unit {
    Lbs -> "lbs"
    Kg -> "kg"
  }
  |> pog.text
}
