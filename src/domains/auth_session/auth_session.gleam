import app/db
import domains/auth_session/sql
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_entity
}
