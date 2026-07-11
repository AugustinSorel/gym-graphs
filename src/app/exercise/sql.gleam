//// This module contains the code to run the sql queries defined in
//// `./src/app/exercise/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/option.{type Option}
import gleam/time/timestamp.{type Timestamp}
import pog

/// A row you get from running the `count_by_user_id` query
/// defined in `./src/app/exercise/sql/count_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CountByUserIdRow {
  CountByUserIdRow(count: Int)
}

/// Runs the `count_by_user_id` query
/// defined in `./src/app/exercise/sql/count_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn count_by_user_id(
  db: pog.Connection,
  user_id: Int,
  arg_2: String,
) -> Result(pog.Returned(CountByUserIdRow), pog.QueryError) {
  let decoder = {
    use count <- decode.field(0, decode.int)
    decode.success(CountByUserIdRow(count:))
  }

  "select count(*)::int as count
from exercises
where user_id = $1
  and ($2 = '' or name ilike '%' || $2 || '%')
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create` query
/// defined in `./src/app/exercise/sql/create.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateRow {
  CreateRow(id: Int, name: String)
}

/// Runs the `create` query
/// defined in `./src/app/exercise/sql/create.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create(
  db: pog.Connection,
  arg_1: Int,
  arg_2: String,
) -> Result(pog.Returned(CreateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(CreateRow(id:, name:))
  }

  "insert into exercises (user_id, name)
values ($1, $2)
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `delete` query
/// defined in `./src/app/exercise/sql/delete.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DeleteRow {
  DeleteRow(id: Int, name: String)
}

/// Runs the `delete` query
/// defined in `./src/app/exercise/sql/delete.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete(
  db: pog.Connection,
  id: Int,
  user_id: Int,
) -> Result(pog.Returned(DeleteRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(DeleteRow(id:, name:))
  }

  "delete from exercises
where id = $1
  and user_id = $2
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `insert_exercise_tag` query
/// defined in `./src/app/exercise/sql/insert_exercise_tag.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn insert_exercise_tag(
  db: pog.Connection,
  arg_1: Int,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "insert into exercise_tags (exercise_id, tag_id)
values ($1, $2)
"
  |> pog.query
  |> pog.parameter(pog.int(arg_1))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_id_and_user_id` query
/// defined in `./src/app/exercise/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByIdAndUserIdRow {
  SelectByIdAndUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_id_and_user_id` query
/// defined in `./src/app/exercise/sql/select_by_id_and_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_id_and_user_id(
  db: pog.Connection,
  id: Int,
  user_id: Int,
) -> Result(pog.Returned(SelectByIdAndUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectByIdAndUserIdRow(id:, name:))
  }

  "select id, name
from exercises
where id = $1
  and user_id = $2
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_by_user_id` query
/// defined in `./src/app/exercise/sql/select_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectByUserIdRow {
  SelectByUserIdRow(id: Int, name: String)
}

/// Runs the `select_by_user_id` query
/// defined in `./src/app/exercise/sql/select_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_by_user_id(
  db: pog.Connection,
  user_id: Int,
) -> Result(pog.Returned(SelectByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(SelectByUserIdRow(id:, name:))
  }

  "select id, name
from exercises
where user_id = $1
order by name asc
"
  |> pog.query
  |> pog.parameter(pog.int(user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_page_by_user_id` query
/// defined in `./src/app/exercise/sql/select_page_by_user_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectPageByUserIdRow {
  SelectPageByUserIdRow(
    id: Int,
    name: String,
    index: Int,
    last_reps: Option(Int),
    last_weight_in_g: Option(Int),
    prev_reps: Option(Int),
    prev_weight_in_g: Option(Int),
    sets_count: Int,
    last_set_at: Option(Timestamp),
  )
}

/// Runs the `select_page_by_user_id` query
/// defined in `./src/app/exercise/sql/select_page_by_user_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_page_by_user_id(
  db: pog.Connection,
  e_user_id: Int,
  arg_2: Int,
  arg_3: Int,
  arg_4: String,
) -> Result(pog.Returned(SelectPageByUserIdRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    use index <- decode.field(2, decode.int)
    use last_reps <- decode.field(3, decode.optional(decode.int))
    use last_weight_in_g <- decode.field(4, decode.optional(decode.int))
    use prev_reps <- decode.field(5, decode.optional(decode.int))
    use prev_weight_in_g <- decode.field(6, decode.optional(decode.int))
    use sets_count <- decode.field(7, decode.int)
    use last_set_at <- decode.field(8, decode.optional(pog.timestamp_decoder()))
    decode.success(SelectPageByUserIdRow(
      id:,
      name:,
      index:,
      last_reps:,
      last_weight_in_g:,
      prev_reps:,
      prev_weight_in_g:,
      sets_count:,
      last_set_at:,
    ))
  }

  "select
  e.id,
  e.name,
  e.index,
  s1.repetitions as last_reps,
  s1.weight_in_g as last_weight_in_g,
  s2.repetitions as prev_reps,
  s2.weight_in_g as prev_weight_in_g,
  sc.sets_count,
  sl.last_set_at
from exercises e
left join lateral (
  select repetitions, weight_in_g
  from sets
  where exercise_id = e.id
  order by created_at desc
  limit 1
) s1 on true
left join lateral (
  select repetitions, weight_in_g
  from sets
  where exercise_id = e.id
  order by created_at desc
  limit 1 offset 1
) s2 on true
left join lateral (
  select count(*)::int as sets_count
  from sets
  where exercise_id = e.id
) sc on true
left join lateral (
  select created_at as last_set_at
  from sets
  where exercise_id = e.id
  order by created_at desc
  limit 1
) sl on true
where e.user_id = $1
  and ($2 = -1 or e.index < $2)
  and ($4 = '' or e.name ilike '%' || $4 || '%')
order by e.index desc
limit $3
"
  |> pog.query
  |> pog.parameter(pog.int(e_user_id))
  |> pog.parameter(pog.int(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.parameter(pog.text(arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `select_stats_by_exercise_id` query
/// defined in `./src/app/exercise/sql/select_stats_by_exercise_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type SelectStatsByExerciseIdRow {
  SelectStatsByExerciseIdRow(
    best_1rm_weight_in_g: Option(Int),
    best_1rm_reps: Option(Int),
    max_weight_in_g: Int,
    total_volume_in_g: Int,
    total_sets: Int,
  )
}

/// Runs the `select_stats_by_exercise_id` query
/// defined in `./src/app/exercise/sql/select_stats_by_exercise_id.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn select_stats_by_exercise_id(
  db: pog.Connection,
  e_id: Int,
  e_user_id: Int,
) -> Result(pog.Returned(SelectStatsByExerciseIdRow), pog.QueryError) {
  let decoder = {
    use best_1rm_weight_in_g <- decode.field(0, decode.optional(decode.int))
    use best_1rm_reps <- decode.field(1, decode.optional(decode.int))
    use max_weight_in_g <- decode.field(2, decode.int)
    use total_volume_in_g <- decode.field(3, decode.int)
    use total_sets <- decode.field(4, decode.int)
    decode.success(SelectStatsByExerciseIdRow(
      best_1rm_weight_in_g:,
      best_1rm_reps:,
      max_weight_in_g:,
      total_volume_in_g:,
      total_sets:,
    ))
  }

  "select
  s_best.weight_in_g as best_1rm_weight_in_g,
  s_best.repetitions as best_1rm_reps,
  agg.max_weight_in_g,
  agg.total_volume_in_g,
  agg.total_sets
from exercises e
left join lateral (
  select weight_in_g, repetitions
  from sets
  where exercise_id = e.id
  order by (weight_in_g::float * (1.0 + repetitions::float / 30.0)) desc
  limit 1
) s_best on true
left join lateral (
  select
    max(weight_in_g) as max_weight_in_g,
    sum(weight_in_g * repetitions)::bigint as total_volume_in_g,
    count(*)::int as total_sets
  from sets
  where exercise_id = e.id
) agg on true
where e.id = $1
  and e.user_id = $2
"
  |> pog.query
  |> pog.parameter(pog.int(e_id))
  |> pog.parameter(pog.int(e_user_id))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update` query
/// defined in `./src/app/exercise/sql/update.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateRow {
  UpdateRow(id: Int, name: String)
}

/// Runs the `update` query
/// defined in `./src/app/exercise/sql/update.sql`.
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update(
  db: pog.Connection,
  id: Int,
  user_id: Int,
  name: String,
) -> Result(pog.Returned(UpdateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, decode.int)
    use name <- decode.field(1, decode.string)
    decode.success(UpdateRow(id:, name:))
  }

  "update exercises
set name = $3
where id = $1
  and user_id = $2
returning id, name
"
  |> pog.query
  |> pog.parameter(pog.int(id))
  |> pog.parameter(pog.int(user_id))
  |> pog.parameter(pog.text(name))
  |> pog.returning(decoder)
  |> pog.execute(db)
}
