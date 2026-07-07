import app/db
import app/exercise/sql
import gleam/bool
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import pog.{type Connection}

pub const page_size = 20

pub type Page {
  Page(rows: List(sql.SelectPageByUserIdRow), next_cursor: Option(Int))
}

pub fn create(db: Connection, user_id: Int, name: String) {
  sql.create(db, user_id, name)
  |> db.extract_first_row
}

pub fn attach_tags(db: Connection, exercise_id: Int, tag_ids: List(Int)) {
  list.try_each(tag_ids, fn(tag_id) {
    sql.insert_exercise_tag(db, exercise_id, tag_id)
    |> db.extract_rows
    |> result.replace(Nil)
  })
}

pub fn select_by_user_id(db: Connection, user_id: Int) {
  sql.select_by_user_id(db, user_id)
  |> db.extract_rows
}

pub fn select_by_id_and_user_id(
  db: Connection,
  exercise_id: Int,
  user_id: Int,
) {
  sql.select_by_id_and_user_id(db, exercise_id, user_id)
  |> db.extract_first_row
}

pub fn rename(db: Connection, exercise_id: Int, user_id: Int, name: String) {
  sql.update(db, exercise_id, user_id, name)
  |> db.extract_first_row
}

pub fn delete(db: Connection, exercise_id: Int, user_id: Int) {
  sql.delete(db, exercise_id, user_id)
  |> db.extract_first_row
}

pub fn count(db: Connection, user_id: Int, query: String) {
  sql.count_by_user_id(db, user_id, query)
  |> db.extract_first_row
  |> result.map(fn(row) { row.count })
}

pub fn select_page(
  db: Connection,
  user_id: Int,
  cursor: Option(Int),
  query: String,
) {
  let cursor_value = option.unwrap(cursor, -1)

  sql.select_page_by_user_id(db, user_id, cursor_value, page_size + 1, query)
  |> db.extract_rows
  |> result.try(fn(rows) {
    let more_result = list.length(rows) > page_size

    use <- bool.guard(
      when: !more_result,
      return: Ok(Page(rows:, next_cursor: None)),
    )

    let visible = list.take(rows, page_size)

    let cursor =
      visible
      |> list.last
      |> option.from_result
      |> option.map(fn(row) { row.index })

    Ok(Page(rows: visible, next_cursor: cursor))
  })
}
