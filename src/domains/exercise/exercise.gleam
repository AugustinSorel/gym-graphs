import app/db
import domains/exercise/sql
import gleam/list
import gleam/result
import pog.{type Connection}

pub type Exercise {
  Exercise(id: Int, name: String)
}

pub fn insert_many(db: Connection, user_id: Int, tags: List(String)) {
  sql.insert_exercises(db, user_id, tags)
  |> db.extract_entities
  |> result.map(fn(rows) {
    list.map(rows, fn(row) { Exercise(id: row.id, name: row.name) })
  })
}
