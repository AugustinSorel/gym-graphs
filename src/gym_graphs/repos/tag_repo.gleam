import gleam/list
import gleam/option
import gleam/result
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/tag.{type Name, type TagId}
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

pub fn select_by_id_and_user_id(db: Connection, id: TagId, user_id: UserId) {
  sql.select_tag_by_id_and_user_id(db, id.value, user_id.value)
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) ->
        option.Some(tag.Tag(id: tag.TagId(row.id), name: tag.Name(row.name)))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

pub fn update_name_by_id_and_user_id(
  db: Connection,
  id: TagId,
  user_id: UserId,
  name: Name,
) {
  sql.update_tag_name_by_id_and_user_id(db, id.value, user_id.value, name.value)
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) -> option.Some(tag.TagId(row.id))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

pub fn delete_by_id_and_user_id(db: Connection, id: TagId, user_id: UserId) {
  sql.delete_tag_by_id_and_user_id(db, id.value, user_id.value)
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) -> option.Some(tag.TagId(row.id))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

pub fn count_by_user_id(db: Connection, user_id: UserId) {
  sql.count_tags_by_user_id(db, user_id.value)
  |> result.map(fn(result) {
    let assert pog.Returned(rows: [row], count: 1) = result
    row.total_count
  })
}

pub fn select_all_by_user_id(db: Connection, user_id: UserId) {
  sql.select_tags_by_user_id(db, user_id.value)
  |> result.map(fn(result) {
    let pog.Returned(rows:, count: _) = result
    list.map(rows, fn(row) {
      tag.Tag(id: tag.TagId(row.id), name: tag.Name(row.name))
    })
  })
}

pub fn select_by_exercise_id_and_user_id(
  db: Connection,
  exercise_id: ExerciseId,
  user_id: UserId,
) {
  sql.select_exercise_tags_by_id_and_user_id(
    db,
    exercise_id.value,
    user_id.value,
  )
  |> result.map(fn(result) {
    let pog.Returned(rows:, count: _) = result
    list.map(rows, fn(row) {
      tag.Tag(id: tag.TagId(row.id), name: tag.Name(row.name))
    })
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
