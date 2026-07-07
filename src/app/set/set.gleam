import app/db
import app/set/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  exercise_id: Int,
  repetitions: Int,
  weight_in_g: Int,
) {
  sql.create(db, exercise_id, repetitions, weight_in_g)
  |> db.extract_first_row
}
