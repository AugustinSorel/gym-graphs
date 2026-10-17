import gleam/option
import gleam/result
import gym_graphs/domains/sign_up_session.{type SignUpSessionId}
import gym_graphs/domains/user.{type Name, type PasswordHash}
import gym_graphs/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  password_hash: PasswordHash,
  name: Name,
  sign_up_session_id: SignUpSessionId,
) {
  sql.create_user(db, password_hash.value, name.value, sign_up_session_id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        user.User(id: user.UserId(entity.id))
        |> option.Some()
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}
