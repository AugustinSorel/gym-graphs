import gleam/list
import gleam/result
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/user.{
  type OneRepMaxAlgorithm, type UserId, type WeightUnit,
}
import gym_graphs/repos/sql
import pog.{type Connection, type QueryError}

pub type Account {
  Account(
    id: Int,
    email_address: String,
    name: String,
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
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

pub type DataExport {
  DataExport(
    account: Account,
    tags: List(Tag),
    exercises: List(Exercise),
    exercise_tags: List(ExerciseTag),
    sets: List(WorkoutSet),
  )
}

pub type LoadError {
  AccountNotFound
  DatabaseFailure(QueryError)
}

pub fn load(db: Connection, user_id: UserId) {
  pog.transaction(db, fn(tx) {
    use _ <- result.try(
      sql.set_transaction_repeatable_read(tx)
      |> result.map_error(DatabaseFailure),
    )
    use account_result <- result.try(
      sql.select_export_account_by_user_id(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use account <- result.try(case account_result.rows {
      [row] -> Ok(account_from_row(row))
      [] -> Error(AccountNotFound)
      _ -> Error(AccountNotFound)
    })
    use tags_result <- result.try(
      sql.select_export_tags_by_user_id(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use exercises_result <- result.try(
      sql.select_export_exercises_by_user_id(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use exercise_tags_result <- result.try(
      sql.select_export_exercise_tags_by_user_id(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )
    use sets_result <- result.try(
      sql.select_export_sets_by_user_id(tx, user_id.value)
      |> result.map_error(DatabaseFailure),
    )

    Ok(DataExport(
      account:,
      tags: list.map(tags_result.rows, tag_from_row),
      exercises: list.map(exercises_result.rows, exercise_from_row),
      exercise_tags: list.map(exercise_tags_result.rows, exercise_tag_from_row),
      sets: list.map(sets_result.rows, workout_set_from_row),
    ))
  })
}

fn account_from_row(row: sql.SelectExportAccountByUserIdRow) -> Account {
  Account(
    id: row.id,
    email_address: row.email_address,
    name: row.name,
    weight_unit: case row.weight_unit {
      sql.Kg -> user.Kg
      sql.Lbs -> user.Lbs
    },
    one_rep_max_algorithm: case row.one_rep_max_algorithm {
      sql.Adams -> user.Adams
      sql.Baechle -> user.Baechle
      sql.Berger -> user.Berger
      sql.Brown -> user.Brown
      sql.Brzycki -> user.Brzycki
      sql.Epley -> user.Epley
      sql.Kemmler -> user.Kemmler
      sql.Landers -> user.Landers
      sql.Lombardi -> user.Lombardi
      sql.Mayhew -> user.Mayhew
      sql.Naclerio -> user.Naclerio
      sql.Oconner -> user.Oconner
      sql.Wathen -> user.Wathen
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

fn tag_from_row(row: sql.SelectExportTagsByUserIdRow) -> Tag {
  Tag(
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

fn exercise_from_row(row: sql.SelectExportExercisesByUserIdRow) -> Exercise {
  Exercise(
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

fn exercise_tag_from_row(
  row: sql.SelectExportExerciseTagsByUserIdRow,
) -> ExerciseTag {
  ExerciseTag(
    exercise_id: row.exercise_id,
    tag_id: row.tag_id,
    created_at: row.created_at,
  )
}

fn workout_set_from_row(row: sql.SelectExportSetsByUserIdRow) -> WorkoutSet {
  WorkoutSet(
    id: row.id,
    exercise_id: row.exercise_id,
    repetitions: row.repetitions,
    weight_in_g: row.weight_in_g,
    done_at: row.done_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}
