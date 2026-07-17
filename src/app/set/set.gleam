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

pub fn select_latest(db: Connection, exercise_id: Int) {
  sql.select_latest_by_exercise_id(db, exercise_id)
  |> db.extract_optional
}

pub fn select_for_export(db: Connection, user_id: Int) {
  sql.select_for_export_by_user_id(db, user_id)
  |> db.extract_rows
}
