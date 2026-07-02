import app/db
import app/exercise/sql
import pog.{type Connection}

pub fn create(db: Connection, user_id: Int, name: String) {
  sql.create(db, user_id, name)
  |> db.extract_first_row
}

pub fn select_by_user_id(db: Connection, user_id: Int) {
  sql.select_by_user_id(db, user_id)
  |> db.extract_rows
}
