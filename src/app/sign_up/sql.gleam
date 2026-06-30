//// This module contains the code to run the sql queries defined in
//// `./src/app/sign_up/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/sign_up/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `create` query
/// defined in `./src/app/sign_up/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: BitArray,
  arg_2: String,
  arg_3: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
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
    decode.success(CreateRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "insert into sign_up_sessions (
  secret_hash, email_address, email_address_verification_code 
) 
values 
  ($1, $2, $3)
returning *;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete_by_id` query
/// defined in `./src/app/sign_up/sql/delete_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteByIdRow {
  DeleteByIdRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `delete_by_id` query
/// defined in `./src/app/sign_up/sql/delete_by_id.sql`.
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
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(DeleteByIdRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "delete from sign_up_sessions where id = $1 returning *;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id` query
/// defined in `./src/app/sign_up/sql/select_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdRow {
  SelectByIdRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `select_by_id` query
/// defined in `./src/app/sign_up/sql/select_by_id.sql`.
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
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(SelectByIdRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "select * from sign_up_sessions where id = $1 and created_at > now() - interval '24 hours';
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `verify` query
/// defined in `./src/app/sign_up/sql/verify.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type VerifyRow {
  VerifyRow(
    id: Int,
    secret_hash: BitArray,
    email_address: String,
    email_address_verification_code: String,
    email_address_verified_at: Option(Timestamp),
    created_at: Timestamp,
  )
}

/// Runs the `verify` query
/// defined in `./src/app/sign_up/sql/verify.sql`.
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
    use secret_hash <- decode.field(1, decode.bit_array)
    use email_address <- decode.field(2, decode.string)
    use email_address_verification_code <- decode.field(3, decode.string)
    use email_address_verified_at <- decode.field(
      4,
      decode.optional(pog.timestamp_decoder()),
    )
    use created_at <- decode.field(5, pog.timestamp_decoder())
    decode.success(VerifyRow(
      id:,
      secret_hash:,
      email_address:,
      email_address_verification_code:,
      email_address_verified_at:,
      created_at:,
    ))
  }

  "update 
  sign_up_sessions 
set 
  email_address_verified_at = now() 
where 
  id = $1 
  and email_address_verified_at is null 
returning 
  *;
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
