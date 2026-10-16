//// This module contains the code to run the sql queries defined in
//// `./src/gym_graphs/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create_sign_up_session` query
/// defined in `./src/gym_graphs/sql/create_sign_up_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateSignUpSessionRow {
  CreateSignUpSessionRow(id: Int)
}

/// Runs the `create_sign_up_session` query
/// defined in `./src/gym_graphs/sql/create_sign_up_session.sql`.
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
    decode.success(CreateSignUpSessionRow(id:))
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
returning id;
"
  |> pog.query
  |> pog.parameter(pog.bytea(arg_1))
  |> pog.parameter(pog.text(email_address))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_auth_session_by_id` query
/// defined in `./src/gym_graphs/sql/select_auth_session_by_id.sql`.
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
/// defined in `./src/gym_graphs/sql/select_auth_session_by_id.sql`.
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
