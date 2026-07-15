import app/db
import app/tag/sql
import pog.{type Connection}

pub fn create(db: Connection, user_id: Int, name: String) {
  sql.create(db, user_id, name)
  |> db.extract_first_row
}

pub fn select_by_user_id(db: Connection, user_id: Int) {
  sql.select_by_user_id(db, user_id)
  |> db.extract_rows
}

pub fn select_by_exercise_id(
  db: Connection,
  exercise_id: Int,
  user_id: Int,
) {
  sql.select_by_exercise_id(db, exercise_id, user_id)
  |> db.extract_rows
}

pub fn select_by_id_and_user_id(db: Connection, tag_id: Int, user_id: Int) {
  sql.select_by_id_and_user_id(db, tag_id, user_id)
  |> db.extract_first_row
}

pub fn rename(db: Connection, tag_id: Int, user_id: Int, name: String) {
  sql.update(db, tag_id, user_id, name)
  |> db.extract_first_row
}

pub fn delete(db: Connection, tag_id: Int, user_id: Int) {
  sql.delete(db, tag_id, user_id)
  |> db.extract_first_row
}
