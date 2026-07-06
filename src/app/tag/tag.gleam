import app/db
import app/tag/sql
import pog.{type Connection}

pub fn create(db: Connection, user_id: Int, name: String) {
  sql.create(db, user_id, name)
  |> db.extract_first_row
}
