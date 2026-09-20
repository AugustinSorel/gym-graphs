import domains/set/sql
import gleam/time/timestamp.{type Timestamp}
import pog.{type Connection}

pub fn insert_many(
  db: Connection,
  exercise_ids: List(Int),
  repetitions: List(Int),
  weights_in_g: List(Int),
  done_ats: List(Timestamp),
) {
  sql.insert_sets(db, exercise_ids, repetitions, weights_in_g, done_ats)
}
