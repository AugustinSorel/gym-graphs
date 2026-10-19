import gleam/list
import gleam/result
import gym_graphs/domains/tag.{type Name}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn create(db: Connection, user_id: UserId, name: Name) {
  sql.create_tag(db, user_id.value, name.value)
  |> result.map(fn(result) {
    let assert pog.Returned(rows: [row], count: 1) = result
    tag.TagId(row.id)
  })
}

pub fn count_by_user_id(db: Connection, user_id: UserId) {
  sql.count_tags_by_user_id(db, user_id.value)
  |> result.map(fn(result) {
    let assert pog.Returned(rows: [row], count: 1) = result
    row.total_count
  })
}

pub fn select_page_by_user_id(
  db: Connection,
  user_id: UserId,
  after_id: Int,
  limit: Int,
) {
  sql.select_tags_page_by_user_id(db, user_id.value, after_id, limit)
  |> result.map(fn(result) {
    let pog.Returned(rows:, count: _) = result
    list.map(rows, fn(row) {
      tag.Tag(id: tag.TagId(row.id), name: tag.Name(row.name))
    })
  })
}
