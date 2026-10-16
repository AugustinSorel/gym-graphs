import gleam/option
import gleam/result
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session
import gym_graphs/domains/user
import gym_graphs/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  email: user.Email,
  secret_hash: session.SessionSecretHash,
  verification_code: sign_up_session.EmailVerificationCode,
) {
  sql.create_sign_up_session(
    db,
    session.secret_hash_to_bit_array(secret_hash),
    user.email_to_string(email),
    sign_up_session.email_verification_code_to_string(verification_code),
  )
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: []) -> option.None
      pog.Returned(count: _, rows: [entity, ..]) ->
        entity.id
        |> sign_up_session.new_id
        |> sign_up_session.new
        |> option.Some
    }
  })
}
