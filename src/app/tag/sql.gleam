//// This module contains the code to run the sql queries defined in
//// `./src/app/tag/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/tag/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, name: String)
}

/// Runs the `create` query
/// defined in `./src/app/tag/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: Int,
  arg_2: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(CreateRow(id:, name:))
  }

  "insert into tags (user_id, name)
values ($1, $2)
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update` query
/// defined in `./src/app/tag/sql/update.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateRow {
  UpdateRow(id: Int, name: String)
}

/// Runs the `update` query
/// defined in `./src/app/tag/sql/update.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update(
  db: pog.Connection,
  tag_id: Int,
  user_id: Int,
  name: String,
) -> Result(pog.Returned(UpdateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(UpdateRow(id:, name:))
  }

  "update tags
set name = $3
where id = $1
  and user_id = $2
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(tag_id))
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(name))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id_and_user_id` query
/// defined in `./src/app/tag/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdAndUserIdRow {
  SelectByIdAndUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_id_and_user_id` query
/// defined in `./src/app/tag/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id_and_user_id(
  db: pog.Connection,
  tag_id: Int,
  user_id: Int,
) -> Result(pog.Returned(SelectByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectByIdAndUserIdRow(id:, name:))
  }

  "select id, name
from tags
where id = $1
  and user_id = $2
"
  |> pog.query
  |> pog.parameter(pog.int(tag_id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_user_id` query
/// defined in `./src/app/tag/sql/select_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByUserIdRow {
  SelectByUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_user_id` query
/// defined in `./src/app/tag/sql/select_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_user_id(
  db: pog.Connection,
  user_id: Int,
) -> Result(pog.Returned(SelectByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectByUserIdRow(id:, name:))
  }

  "select id, name
from tags
where user_id = $1
order by name asc
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
