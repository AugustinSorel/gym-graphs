import gleam/result
import gym_graphs/domains/user.{type UserId}
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn count_by_user_id(db: Connection, user_id: UserId) {
  sql.count_exercises_by_user_id(db, user_id.value)
  |> result.map(fn(result) {
    let assert pog.Returned(rows: [row], count: 1) = result
    row.total_count
  })
}
