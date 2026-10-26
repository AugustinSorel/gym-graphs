import gleam/list
import gleam/option
import gleam/result
import gleam/time/timestamp.{type Timestamp}
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type UserId}
import gym_graphs/domains/weight
import gym_graphs/domains/workout_set
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn select_page_by_exercise_id_and_user_id(
  db: Connection,
  exercise_id: ExerciseId,
  user_id: UserId,
  position: workout_set.PagePosition,
  limit: Int,
) {
  case position {
    workout_set.FirstPage ->
      sql.select_first_sets_page_by_exercise_id_and_user_id(
        db,
        exercise_id.value,
        user_id.value,
        limit,
      )
      |> result.map(fn(result) {
        let pog.Returned(rows:, count: _) = result
        list.map(rows, fn(row) {
          exercise_set(row.id, row.repetitions, row.weight_in_g, row.done_at)
        })
      })
    workout_set.After(workout_set.PageCursor(done_at:, id:)) ->
      sql.select_sets_page_after_cursor_by_exercise_id_and_user_id(
        db,
        exercise_id.value,
        user_id.value,
        done_at,
        id.value,
        limit,
      )
      |> result.map(fn(result) {
        let pog.Returned(rows:, count: _) = result
        list.map(rows, fn(row) {
          exercise_set(row.id, row.repetitions, row.weight_in_g, row.done_at)
        })
      })
  }
}

pub fn create(
  db: Connection,
  exercise_id: ExerciseId,
  repetitions: List(Int),
  weights: List(weight.Weight),
) {
  sql.create_sets(
    db,
    exercise_id.value,
    repetitions,
    list.map(weights, weight.in_grams),
  )
  |> result.replace(Nil)
}

pub fn select_by_id_and_exercise_id_and_user_id(
  db: Connection,
  id: workout_set.SetId,
  exercise_id: ExerciseId,
  user_id: UserId,
) {
  sql.select_set_by_id_and_exercise_id_and_user_id(
    db,
    id.value,
    exercise_id.value,
    user_id.value,
  )
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) ->
        option.Some(exercise_set(
          row.id,
          row.repetitions,
          row.weight_in_g,
          row.done_at,
        ))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

pub fn delete_by_id_and_exercise_id_and_user_id(
  db: Connection,
  id: workout_set.SetId,
  exercise_id: ExerciseId,
  user_id: UserId,
) {
  sql.delete_set_by_id_and_exercise_id_and_user_id(
    db,
    id.value,
    exercise_id.value,
    user_id.value,
  )
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) ->
        option.Some(workout_set.SetId(row.id))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

fn exercise_set(
  id: Int,
  repetitions: Int,
  weight_in_g: Int,
  done_at: Timestamp,
) -> workout_set.ExerciseSet {
  workout_set.ExerciseSet(
    id: workout_set.SetId(id),
    repetitions:,
    weight: weight.from_grams(weight_in_g),
    done_at:,
  )
}
