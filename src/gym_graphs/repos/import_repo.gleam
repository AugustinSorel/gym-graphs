import gleam/bool
import gleam/dict.{type Dict}
import gleam/list
import gleam/result
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/sql
import pog.{type Connection, type QueryError}

pub type ImportError {
  AccountNotFound
  AccountNotEmpty
  InvalidReference
  DatabaseFailure(QueryError)
}

pub fn restore(db: Connection, user_id: UserId, document: Document) {
  pog.transaction(db, fn(tx) {
    use account_result <- result.try(
      sql.select_import_account_for_update(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use <- bool.guard(
      when: account_result.rows == [],
      return: Error(AccountNotFound),
    )
    use account_state_result <- result.try(
      sql.select_import_account_state(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use account_state <- result.try(case account_state_result.rows {
      [row] -> Ok(row)
      _ -> Error(AccountNotFound)
    })
    use <- bool.guard(
      when: account_state.has_tags || account_state.has_exercises,
      return: Error(AccountNotEmpty),
    )
    use tag_ids <- result.try(insert_tags(tx, user_id, document.tags))
    use exercise_ids <- result.try(insert_exercises(
      tx,
      user_id,
      document.exercises,
    ))
    use Nil <- result.try(insert_exercise_tags(
      tx,
      document.exercise_tags,
      exercise_ids,
      tag_ids,
    ))
    use Nil <- result.try(insert_sets(tx, document.sets, exercise_ids))

    Ok(Nil)
  })
}

fn insert_tags(
  db: Connection,
  user_id: UserId,
  tags: List(Tag),
) -> Result(Dict(Int, Int), ImportError) {
  case tags {
    [] -> Ok(dict.new())
    _ -> {
      use inserted <- result.try(
        sql.create_import_tags(
          db,
          user_id.value,
          list.map(tags, fn(tag) { tag.id }),
          list.map(tags, fn(tag) { tag.name }),
          list.map(tags, fn(tag) { tag.created_at }),
          list.map(tags, fn(tag) { tag.updated_at }),
        )
        |> result.map_error(DatabaseFailure),
      )
      Ok(
        dict.from_list(
          list.map(inserted.rows, fn(row) { #(row.source_id, row.id) }),
        ),
      )
    }
  }
}

fn insert_exercises(
  db: Connection,
  user_id: UserId,
  exercises: List(Exercise),
) -> Result(Dict(Int, Int), ImportError) {
  case exercises {
    [] -> Ok(dict.new())
    _ -> {
      use inserted <- result.try(
        sql.create_import_exercises(
          db,
          user_id.value,
          list.map(exercises, fn(exercise) { exercise.id }),
          list.map(exercises, fn(exercise) { exercise.name }),
          list.map(exercises, fn(exercise) { exercise.created_at }),
          list.map(exercises, fn(exercise) { exercise.updated_at }),
        )
        |> result.map_error(DatabaseFailure),
      )
      Ok(
        dict.from_list(
          list.map(inserted.rows, fn(row) { #(row.source_id, row.id) }),
        ),
      )
    }
  }
}

fn insert_exercise_tags(
  db: Connection,
  links: List(ExerciseTag),
  exercise_ids: Dict(Int, Int),
  tag_ids: Dict(Int, Int),
) -> Result(Nil, ImportError) {
  case links {
    [] -> Ok(Nil)
    _ -> {
      use rows <- result.try(
        list.try_map(links, fn(link) {
          use exercise_id <- result.try(
            dict.get(exercise_ids, link.exercise_id)
            |> result.map_error(fn(_) { InvalidReference }),
          )
          use tag_id <- result.try(
            dict.get(tag_ids, link.tag_id)
            |> result.map_error(fn(_) { InvalidReference }),
          )
          Ok(#(exercise_id, tag_id, link.created_at))
        }),
      )

      sql.create_import_exercise_tags(
        db,
        list.map(rows, fn(row) { row.0 }),
        list.map(rows, fn(row) { row.1 }),
        list.map(rows, fn(row) { row.2 }),
      )
      |> result.map_error(DatabaseFailure)
      |> result.replace(Nil)
    }
  }
}

fn insert_sets(
  db: Connection,
  sets: List(WorkoutSet),
  exercise_ids: Dict(Int, Int),
) -> Result(Nil, ImportError) {
  case sets {
    [] -> Ok(Nil)
    _ -> {
      use rows <- result.try(
        list.try_map(sets, fn(set) {
          use exercise_id <- result.try(
            dict.get(exercise_ids, set.exercise_id)
            |> result.map_error(fn(_) { InvalidReference }),
          )
          Ok(#(
            exercise_id,
            set.repetitions,
            set.weight_in_g,
            set.done_at,
            set.created_at,
            set.updated_at,
          ))
        }),
      )

      sql.create_import_sets(
        db,
        list.map(rows, fn(row) { row.0 }),
        list.map(rows, fn(row) { row.1 }),
        list.map(rows, fn(row) { row.2 }),
        list.map(rows, fn(row) { row.3 }),
        list.map(rows, fn(row) { row.4 }),
        list.map(rows, fn(row) { row.5 }),
      )
      |> result.map_error(DatabaseFailure)
      |> result.replace(Nil)
    }
  }
}

pub type Account {
  Account(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: String,
    one_rep_max_algorithm: String,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

pub type Tag {
  Tag(id: Int, name: String, created_at: Timestamp, updated_at: Timestamp)
}

pub type Exercise {
  Exercise(id: Int, name: String, created_at: Timestamp, updated_at: Timestamp)
}

pub type ExerciseTag {
  ExerciseTag(exercise_id: Int, tag_id: Int, created_at: Timestamp)
}

pub type WorkoutSet {
  WorkoutSet(
    id: Int,
    exercise_id: Int,
    repetitions: Int,
    weight_in_g: Int,
    done_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

pub type Document {
  Document(
    exported_at: Timestamp,
    account: Account,
    tags: List(Tag),
    exercises: List(Exercise),
    exercise_tags: List(ExerciseTag),
    sets: List(WorkoutSet),
  )
}
