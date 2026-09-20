//// This module contains the code to run the sql queries defined in
//// `./src/domains/tag/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog

/// A row you get from running the `insert_tags` query
/// defined in `./src/domains/tag/sql/insert_tags.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type InsertTagsRow {
  InsertTagsRow(id: Int, name: String)
}

/// Runs the `insert_tags` query
/// defined in `./src/domains/tag/sql/insert_tags.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn insert_tags(
  db: pog.Connection,
  arg_1: Int,
  arg_2: List(String),
) -> Result(pog.Returned(InsertTagsRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(InsertTagsRow(id:, name:))
  }

  "insert into tags (user_id, name)
select $1, unnest($2::text[])
returning id, name;
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.array(fn(value) { pog.text(value) }, arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
