import domains/set/sql
import pog.{type Connection}

pub fn insert_many(
  db: Connection,
  exercise_ids: List(Int),
  repetitions: List(Int),
  weights_in_g: List(Int),
) {
  sql.insert_sets(db, exercise_ids, repetitions, weights_in_g)
}
