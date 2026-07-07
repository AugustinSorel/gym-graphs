//// This module contains the code to run the sql queries defined in
//// `./src/app/set/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
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
