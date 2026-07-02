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

pub fn select_by_user_id(db: Connection, user_id: Int) {
  sql.select_by_user_id(db, user_id)
  |> db.extract_rows
}

pub fn count(db: Connection, user_id: Int) {
  sql.count_by_user_id(db, user_id)
  |> db.extract_first_row
  |> result.map(fn(row) { row.count })
}

pub fn select_page(db: Connection, user_id: Int, cursor: Option(Int)) {
  let cursor_value = option.unwrap(cursor, -1)

  sql.select_page_by_user_id(db, user_id, cursor_value, page_size + 1)
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
