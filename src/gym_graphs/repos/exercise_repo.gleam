import gleam/bool
import gleam/float
import gleam/list
import gleam/option
import gleam/result
import gym_graphs/domains/exercise.{type ExerciseId, type Name}
import gym_graphs/domains/one_rep_max
import gym_graphs/domains/user.{type OneRepMaxAlgorithm, type UserId}
import gym_graphs/domains/weight
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

pub fn select_by_id_and_user_id(
  db: Connection,
  id: ExerciseId,
  user_id: UserId,
) {
  sql.select_exercise_by_id_and_user_id(db, id.value, user_id.value)
  |> result.map(fn(result) {
    case result {
      pog.Returned(rows: [row, ..], count: _) ->
        option.Some(exercise.Exercise(
          id: exercise.ExerciseId(row.id),
          name: exercise.Name(row.name),
        ))
      pog.Returned(rows: [], count: _) -> option.None
    }
  })
}

pub fn select_facts_by_id_and_user_id(
  db: Connection,
  id: ExerciseId,
  user_id: UserId,
  algorithm: OneRepMaxAlgorithm,
) {
  use facts_result <- result.try(sql.select_exercise_facts_by_id_and_user_id(
    db,
    id.value,
    user_id.value,
  ))
  use performances_result <- result.try(
    sql.select_exercise_set_performances_by_id_and_user_id(
      db,
      id.value,
      user_id.value,
    ),
  )

  let assert pog.Returned(rows: [facts], count: 1) = facts_result
  let pog.Returned(rows: performances, count: _) = performances_result

  let best_one_rep_max =
    list.fold(performances, 0.0, fn(best, performance) {
      one_rep_max.calculate(
        performance.weight_in_g,
        performance.repetitions,
        algorithm,
      )
      |> float.max(best)
    })

  Ok(exercise.ExerciseFacts(
    total_sets: facts.total_sets,
    total_sessions: facts.total_sessions,
    average_repetitions: facts.average_repetitions,
    best_one_rep_max: weight.from_grams(float.round(best_one_rep_max)),
    best_set: exercise.BestSet(
      weight: weight.from_grams(facts.best_set_weight_in_g),
      repetitions: facts.best_set_repetitions,
    ),
  ))
}

pub fn select_page_by_user_id(
  db: Connection,
  user_id: UserId,
  before_id: Int,
  filter_tag_ids: List(Int),
  limit: Int,
) {
  sql.select_exercises_page_by_user_id(
    db,
    user_id.value,
    before_id,
    filter_tag_ids,
    limit,
  )
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
