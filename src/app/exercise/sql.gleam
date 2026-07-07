//// This module contains the code to run the sql queries defined in
//// `./src/app/exercise/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog

/// A row you get from running the `count_by_user_id` query
/// defined in `./src/app/exercise/sql/count_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CountByUserIdRow {
  CountByUserIdRow(count: Int)
}

/// Runs the `count_by_user_id` query
/// defined in `./src/app/exercise/sql/count_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn count_by_user_id(
  db: pog.Connection,
  user_id: Int,
  arg_2: String,
) -> Result(pog.Returned(CountByUserIdRow), pog.QueryError) {
  let decoder = {
    use count <- decode.field(0, decode.int)
    decode.success(CountByUserIdRow(count:))
  }

  "select count(*)::int as count
from exercises
where user_id = $1
  and ($2 = '' or name ilike '%' || $2 || '%')
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create` query
/// defined in `./src/app/exercise/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, name: String)
}

/// Runs the `create` query
/// defined in `./src/app/exercise/sql/create.sql`.
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

  "insert into exercises (user_id, name)
values ($1, $2)
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete` query
/// defined in `./src/app/exercise/sql/delete.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteRow {
  DeleteRow(id: Int, name: String)
}

/// Runs the `delete` query
/// defined in `./src/app/exercise/sql/delete.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete(
  db: pog.Connection,
  id: Int,
  user_id: Int,
) -> Result(pog.Returned(DeleteRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(DeleteRow(id:, name:))
  }

  "delete from exercises
where id = $1
  and user_id = $2
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `insert_exercise_tag` query
/// defined in `./src/app/exercise/sql/insert_exercise_tag.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn insert_exercise_tag(
  db: pog.Connection,
  arg_1: Int,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "insert into exercise_tags (exercise_id, tag_id)
values ($1, $2)
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id_and_user_id` query
/// defined in `./src/app/exercise/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdAndUserIdRow {
  SelectByIdAndUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_id_and_user_id` query
/// defined in `./src/app/exercise/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id_and_user_id(
  db: pog.Connection,
  id: Int,
  user_id: Int,
) -> Result(pog.Returned(SelectByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectByIdAndUserIdRow(id:, name:))
  }

  "select id, name
from exercises
where id = $1
  and user_id = $2
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_user_id` query
/// defined in `./src/app/exercise/sql/select_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByUserIdRow {
  SelectByUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_user_id` query
/// defined in `./src/app/exercise/sql/select_by_user_id.sql`.
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
from exercises
where user_id = $1
order by name asc
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_page_by_user_id` query
/// defined in `./src/app/exercise/sql/select_page_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectPageByUserIdRow {
  SelectPageByUserIdRow(id: Int, name: String, index: Int)
}

/// Runs the `select_page_by_user_id` query
/// defined in `./src/app/exercise/sql/select_page_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_page_by_user_id(
  db: pog.Connection,
  user_id: Int,
  arg_2: Int,
  arg_3: Int,
  arg_4: String,
) -> Result(pog.Returned(SelectPageByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    use index <- decode.field(2, decode.int)
    decode.success(SelectPageByUserIdRow(id:, name:, index:))
  }

  "select id, name, index
from exercises
where user_id = $1
  and ($2 = -1 or index < $2)
  and ($4 = '' or name ilike '%' || $4 || '%')
order by index desc
limit $3
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.int(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.parameter(pog.text(arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update` query
/// defined in `./src/app/exercise/sql/update.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateRow {
  UpdateRow(id: Int, name: String)
}

/// Runs the `update` query
/// defined in `./src/app/exercise/sql/update.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update(
  db: pog.Connection,
  id: Int,
  user_id: Int,
  name: String,
) -> Result(pog.Returned(UpdateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(UpdateRow(id:, name:))
  }

  "update exercises
set name = $3
where id = $1
  and user_id = $2
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(name))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
