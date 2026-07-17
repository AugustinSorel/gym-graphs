//// This module contains the code to run the sql queries defined in
//// `./src/app/set/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `create` query
/// defined in `./src/app/set/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, exercise_id: Int, repetitions: Int, weight_in_g: Int)
}

/// Runs the `create` query
/// defined in `./src/app/set/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: Int,
  arg_2: Int,
  arg_3: Int,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use exercise_id <- decode.field(1, decode.int)
    use repetitions <- decode.field(2, decode.int)
    use weight_in_g <- decode.field(3, decode.int)
    decode.success(CreateRow(id:, exercise_id:, repetitions:, weight_in_g:))
  }

  "insert into sets (exercise_id, repetitions, weight_in_g)
values ($1, $2, $3)
returning id, exercise_id, repetitions, weight_in_g
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.int(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_with_timestamp` query
/// defined in `./src/app/set/sql/create_with_timestamp.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateWithTimestampRow {
  CreateWithTimestampRow(
    id: Int,
    exercise_id: Int,
    repetitions: Int,
    weight_in_g: Int,
  )
}

/// Runs the `create_with_timestamp` query
/// defined in `./src/app/set/sql/create_with_timestamp.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_with_timestamp(
  db: pog.Connection,
  arg_1: Int,
  arg_2: Int,
  arg_3: Int,
  arg_4: Timestamp,
) -> Result(pog.Returned(CreateWithTimestampRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use exercise_id <- decode.field(1, decode.int)
    use repetitions <- decode.field(2, decode.int)
    use weight_in_g <- decode.field(3, decode.int)
    decode.success(CreateWithTimestampRow(
      id:,
      exercise_id:,
      repetitions:,
      weight_in_g:,
    ))
  }

  "insert into sets (exercise_id, repetitions, weight_in_g, created_at)
values ($1, $2, $3, $4)
returning id, exercise_id, repetitions, weight_in_g
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.int(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.parameter(pog.timestamp(arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_for_export_by_user_id` query
/// defined in `./src/app/set/sql/select_for_export_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectForExportByUserIdRow {
  SelectForExportByUserIdRow(
    id: Int,
    repetitions: Int,
    weight_in_g: Int,
    created_at: Timestamp,
    exercise_id: Int,
    exercise_name: String,
  )
}

/// Runs the `select_for_export_by_user_id` query
/// defined in `./src/app/set/sql/select_for_export_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_for_export_by_user_id(
  db: pog.Connection,
  e_user_id: Int,
) -> Result(pog.Returned(SelectForExportByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use repetitions <- decode.field(1, decode.int)
    use weight_in_g <- decode.field(2, decode.int)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use exercise_id <- decode.field(4, decode.int)
    use exercise_name <- decode.field(5, decode.string)
    decode.success(SelectForExportByUserIdRow(
      id:,
      repetitions:,
      weight_in_g:,
      created_at:,
      exercise_id:,
      exercise_name:,
    ))
  }

  "select
  s.id,
  s.repetitions,
  s.weight_in_g,
  s.created_at,
  e.id as exercise_id,
  e.name as exercise_name
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
order by e.name asc, s.created_at asc
"
  |> pog.query
  |> pog.parameter(pog.int(e_user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_latest_by_exercise_id` query
/// defined in `./src/app/set/sql/select_latest_by_exercise_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectLatestByExerciseIdRow {
  SelectLatestByExerciseIdRow(repetitions: Int, weight_in_g: Int)
}

/// Runs the `select_latest_by_exercise_id` query
/// defined in `./src/app/set/sql/select_latest_by_exercise_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_latest_by_exercise_id(
  db: pog.Connection,
  exercise_id: Int,
) -> Result(pog.Returned(SelectLatestByExerciseIdRow), pog.QueryError) {
  let decoder = {
    use repetitions <- decode.field(0, decode.int)
    use weight_in_g <- decode.field(1, decode.int)
    decode.success(SelectLatestByExerciseIdRow(repetitions:, weight_in_g:))
  }

  "select repetitions, weight_in_g
from sets
where exercise_id = $1
order by created_at desc
limit 1
"
  |> pog.query
  |> pog.parameter(pog.int(exercise_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
