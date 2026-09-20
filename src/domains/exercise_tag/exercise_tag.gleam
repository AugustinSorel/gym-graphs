import domains/exercise_tag/sql
import pog.{type Connection}

pub fn insert_many(
  db: Connection,
  exercises_id: List(Int),
  tags_id: List(Int),
) {
  sql.insert_exercise_tags(db, exercises_id, tags_id)
}
