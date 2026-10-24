import gleam/bool
import gleam/list
import gleam/result
import gym_graphs/domains/exercise.{type ExerciseId, type Name}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  user_id: UserId,
  name: Name,
  tag_ids: List(Int),
) -> Result(ExerciseId, pog.QueryError) {
  let tag_ids = list.unique(tag_ids)

  pog.transaction(db, fn(tx) {
    use exercise_id <- result.try(
      sql.create_exercise(tx, user_id.value, name.value)
      |> result.map(fn(row) {
        let assert pog.Returned(rows: [row], count: 1) = row
        exercise.ExerciseId(row.id)
      }),
    )

    use <- bool.guard(when: list.is_empty(tag_ids), return: Ok(exercise_id))

    use Nil <- result.try(
      sql.create_exercise_tags(tx, exercise_id.value, user_id.value, tag_ids)
      |> result.replace(Nil),
    )

    Ok(exercise_id)
  })
  |> result.map_error(fn(error) {
    case error {
      pog.TransactionRolledBack(error) -> error
      pog.TransactionQueryError(error) -> error
    }
  })
}

pub fn count_by_user_id(db: Connection, user_id: UserId) {
  sql.count_exercises_by_user_id(db, user_id.value)
  |> result.map(fn(result) {
    let assert pog.Returned(rows: [row], count: 1) = result
    row.total_count
  })
}

pub fn select_page_by_user_id(
  db: Connection,
  user_id: UserId,
  before_id: Int,
  limit: Int,
) {
  sql.select_exercises_page_by_user_id(db, user_id.value, before_id, limit)
  |> result.map(fn(result) {
    let pog.Returned(rows:, count: _) = result
    list.map(rows, fn(row) {
      exercise.Exercise(
        id: exercise.ExerciseId(row.id),
        name: exercise.Name(row.name),
      )
    })
  })
}
