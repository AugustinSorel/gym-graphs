//// This module contains the code to run the sql queries defined in
//// `./src/domains/set/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog

/// Runs the `insert_sets` query
/// defined in `./src/domains/set/sql/insert_sets.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn insert_sets(
  db: pog.Connection,
  arg_1: List(Int),
  arg_2: List(Int),
  arg_3: List(Int),
  arg_4: List(Timestamp),
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "insert into sets (exercise_id, repetitions, weight_in_g, done_at)
select unnest($1::int[]), unnest($2::int[]), unnest($3::int[]), unnest($4::timestamp[]);
"
  |> pog.query
  |> pog.parameter(pog.array(fn(value) { pog.int(value) }, arg_1))
  |> pog.parameter(pog.array(fn(value) { pog.int(value) }, arg_2))
  |> pog.parameter(pog.array(fn(value) { pog.int(value) }, arg_3))
  |> pog.parameter(pog.array(fn(value) { pog.timestamp(value) }, arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
