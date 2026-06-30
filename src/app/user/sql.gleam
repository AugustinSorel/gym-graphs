//// This module contains the code to run the sql queries defined in
//// `./src/app/user/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/user/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, email_address: String)
}

/// Runs the `create` query
/// defined in `./src/app/user/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: BitArray,
  arg_3: String,
  id: Int,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    decode.success(CreateRow(id:, email_address:))
  }

  "insert into users (email_address, password_hash, password_salt, name)
select
    email_address,
    $1,
    $2,
    $3
from sign_up_sessions
where id = $4 and email_address_verified_at is not null returning
    id, email_address
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete_by_account_deletion_id` query
/// defined in `./src/app/user/sql/delete_by_account_deletion_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteByAccountDeletionIdRow {
  DeleteByAccountDeletionIdRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
    name: String,
    weight_unit: WeightUnit,
  )
}

/// Runs the `delete_by_account_deletion_id` query
/// defined in `./src/app/user/sql/delete_by_account_deletion_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_by_account_deletion_id(
  db: pog.Connection,
  account_deletion_sessions_id: Int,
) -> Result(pog.Returned(DeleteByAccountDeletionIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use name <- decode.field(5, decode.string)
    use weight_unit <- decode.field(6, weight_unit_decoder())
    decode.success(DeleteByAccountDeletionIdRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
      name:,
      weight_unit:,
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

/// A row you get from running the `select_by_email` query
/// defined in `./src/app/user/sql/select_by_email.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByEmailRow {
  SelectByEmailRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
    name: String,
    weight_unit: WeightUnit,
  )
}

/// Runs the `select_by_email` query
/// defined in `./src/app/user/sql/select_by_email.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_email(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(SelectByEmailRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use name <- decode.field(5, decode.string)
    use weight_unit <- decode.field(6, weight_unit_decoder())
    decode.success(SelectByEmailRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
      name:,
      weight_unit:,
    ))
  }

  "select * from users where email_address = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id` query
/// defined in `./src/app/user/sql/select_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdRow {
  SelectByIdRow(
    id: Int,
    email_address: String,
    password_hash: BitArray,
    password_salt: BitArray,
    created_at: Timestamp,
    name: String,
    weight_unit: WeightUnit,
  )
}

/// Runs the `select_by_id` query
/// defined in `./src/app/user/sql/select_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id(
  db: pog.Connection,
  arg_1: Int,
) -> Result(pog.Returned(SelectByIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use email_address <- decode.field(1, decode.string)
    use password_hash <- decode.field(2, decode.bit_array)
    use password_salt <- decode.field(3, decode.bit_array)
    use created_at <- decode.field(4, pog.timestamp_decoder())
    use name <- decode.field(5, decode.string)
    use weight_unit <- decode.field(6, weight_unit_decoder())
    decode.success(SelectByIdRow(
      id:,
      email_address:,
      password_hash:,
      password_salt:,
      created_at:,
      name:,
      weight_unit:,
    ))
  }

  "select * from users where id = $1;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_name` query
/// defined in `./src/app/user/sql/update_name.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateNameRow {
  UpdateNameRow(id: Int, name: String)
}

/// Runs the `update_name` query
/// defined in `./src/app/user/sql/update_name.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_name(
  db: pog.Connection,
  name: String,
  id: Int,
) -> Result(pog.Returned(UpdateNameRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(UpdateNameRow(id:, name:))
  }

  "update users set name = $1 where id = $2 returning id, name;
"
  |> pog.query
  |> pog.parameter(pog.text(name))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_password_by_password_reset_id` query
/// defined in `./src/app/user/sql/update_password_by_password_reset_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdatePasswordByPasswordResetIdRow {
  UpdatePasswordByPasswordResetIdRow(id: Int)
}

/// Runs the `update_password_by_password_reset_id` query
/// defined in `./src/app/user/sql/update_password_by_password_reset_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_password_by_password_reset_id(
  db: pog.Connection,
  arg_1: BitArray,
  password_salt: BitArray,
  password_reset_sessions_id: Int,
) -> Result(pog.Returned(UpdatePasswordByPasswordResetIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdatePasswordByPasswordResetIdRow(id:))
  }

  "update users
set
  password_hash = $1,
  password_salt = $2
from password_reset_sessions
where users.id = password_reset_sessions.user_id
and password_reset_sessions.id = $3
and password_reset_sessions.user_identity_verified_at is not null
returning password_reset_sessions.id;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.bytea(password_salt))
  |> pog.parameter(pog.int(password_reset_sessions_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_password_by_password_update_id` query
/// defined in `./src/app/user/sql/update_password_by_password_update_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdatePasswordByPasswordUpdateIdRow {
  UpdatePasswordByPasswordUpdateIdRow(id: Int)
}

/// Runs the `update_password_by_password_update_id` query
/// defined in `./src/app/user/sql/update_password_by_password_update_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_password_by_password_update_id(
  db: pog.Connection,
  arg_1: BitArray,
  password_salt: BitArray,
  password_update_sessions_id: Int,
) -> Result(pog.Returned(UpdatePasswordByPasswordUpdateIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    decode.success(UpdatePasswordByPasswordUpdateIdRow(id:))
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

/// A row you get from running the `update_weight_unit` query
/// defined in `./src/app/user/sql/update_weight_unit.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateWeightUnitRow {
  UpdateWeightUnitRow(id: Int, weight_unit: WeightUnit)
}

/// Runs the `update_weight_unit` query
/// defined in `./src/app/user/sql/update_weight_unit.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_weight_unit(
  db: pog.Connection,
  weight_unit: WeightUnit,
  id: Int,
) -> Result(pog.Returned(UpdateWeightUnitRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use weight_unit <- decode.field(1, weight_unit_decoder())
    decode.success(UpdateWeightUnitRow(id:, weight_unit:))
  }

  "update users set weight_unit = $1 where id = $2 returning id, weight_unit;
"
  |> pog.query
  |> pog.parameter(weight_unit_encoder(weight_unit))
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

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
