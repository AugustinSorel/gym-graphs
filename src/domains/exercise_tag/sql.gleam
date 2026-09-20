//// This module contains the code to run the sql queries defined in
//// `./src/domains/exercise_tag/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog

/// Runs the `insert_exercise_tags` query
/// defined in `./src/domains/exercise_tag/sql/insert_exercise_tags.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn insert_exercise_tags(
  db: pog.Connection,
  arg_1: List(Int),
  arg_2: List(Int),
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "insert into exercise_tags (exercise_id, tag_id)
select unnest($1::int[]), unnest($2::int[]);
"
  |> pog.query
  |> pog.parameter(pog.array(fn(value) { pog.int(value) }, arg_1))
  |> pog.parameter(pog.array(fn(value) { pog.int(value) }, arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
