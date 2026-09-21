import app/db
import domains/tag/sql
import gleam/list
import gleam/result
import pog.{type Connection}

pub type Tag {
  Tag(id: Int, name: String)
}

pub fn insert_many(db: Connection, user_id: Int, tags: List(String)) {
  sql.insert_tags(db, user_id, tags)
  |> db.extract_entities
  |> result.map(fn(row) {
    list.map(row, fn(tag) { Tag(id: tag.id, name: tag.name) })
  })
}
