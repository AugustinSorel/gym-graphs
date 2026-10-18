import gleam/option
import gleam/result
import gym_graphs/domains/sign_up_session.{type SignUpSessionId}
import gym_graphs/domains/user.{type Email, type Name, type PasswordHash}
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
        user.UserId(entity.id)
        |> option.Some()
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn select_by_email(db: Connection, email: Email) {
  sql.select_user_by_email(db, email.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        new_user(entity.id, entity.email_address, entity.password_hash)
        |> option.Some()
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

fn new_user(id: Int, email: String, password_hash: String) {
  let id = user.UserId(id)
  let password_hash = user.PasswordHash(password_hash)
  let email = user.Email(email)

  user.User(id:, email:, password_hash:)
}
