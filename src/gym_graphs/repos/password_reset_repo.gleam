import gleam/option
import gleam/result
import gym_graphs/domains/password_reset_session.{type EmailVerificationCodeHash}
import gym_graphs/domains/session.{type SessionSecretHash}
import gym_graphs/domains/user.{type Email}
import gym_graphs/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  secret_hash: SessionSecretHash,
  email_code_hash: EmailVerificationCodeHash,
  email: Email,
) {
  sql.create_password_reset_session(
    db,
    secret_hash.value,
    email_code_hash.value,
    email.value,
  )
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> option.Some(entity.id)
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}
