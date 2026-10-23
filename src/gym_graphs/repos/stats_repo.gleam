import gleam/int
import gleam/result
import gym_graphs/domains/stats
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/sql
import pog.{type Connection, type QueryError}

pub type SelectWeeklySummaryError {
  DatabaseFailure(QueryError)
  InvalidAggregate
}

pub fn select_weekly_summary(db: Connection, user_id: UserId) {
  use query_result <- result.try(
    sql.select_weekly_stats_by_user_id(db, user_id.value)
    |> result.map_error(DatabaseFailure),
  )
  use row <- result.try(case query_result {
    pog.Returned(rows: [row], count: 1) -> Ok(row)
    _ -> Error(InvalidAggregate)
  })
  use total_volume_in_g <- result.try(
    int.parse(row.total_volume_in_g)
    |> result.map_error(fn(_) { InvalidAggregate }),
  )
  use total_weight_in_g <- result.try(
    int.parse(row.total_weight_in_g)
    |> result.map_error(fn(_) { InvalidAggregate }),
  )

  Ok(stats.WeeklySummary(
    total_volume_in_g:,
    total_sets: row.total_sets,
    total_weight_in_g:,
    exercises_count: row.exercises_count,
  ))
}
