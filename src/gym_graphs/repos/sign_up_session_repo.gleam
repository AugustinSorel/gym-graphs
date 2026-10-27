import gleam/option
import gleam/result
import gleam/time/timestamp
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session.{type SignUpSessionId}
import gym_graphs/domains/user
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  email: user.Email,
  secret_hash: session.SessionSecretHash,
  verification_code: sign_up_session.EmailVerificationCode,
) {
  sql.create_sign_up_session(
    db,
    secret_hash.value,
    email.value,
    verification_code.value,
  )
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: []) -> option.None
      pog.Returned(count: _, rows: [entity, ..]) -> {
        new_sign_up_session(
          entity.id,
          entity.email_address,
          entity.secret_hash,
          entity.email_address_verification_code,
          entity.email_address_verified_at,
          entity.created_at,
        )
        |> option.Some
      }
    }
  })
}

pub fn select_by_id(db: Connection, id: SignUpSessionId) {
  sql.select_sign_up_session_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: []) -> option.None
      pog.Returned(count: _, rows: [entity, ..]) -> {
        new_sign_up_session(
          entity.id,
          entity.email_address,
          entity.secret_hash,
          entity.email_address_verification_code,
          entity.email_address_verified_at,
          entity.created_at,
        )
        |> option.Some
      }
    }
  })
}

pub fn verify_by_id(db: Connection, id: SignUpSessionId) {
  sql.verify_sign_up_session_by_id(db, id.value)
}

pub fn delete_by_id(db: Connection, id: SignUpSessionId) {
  sql.delete_sign_up_session_by_id(db, id.value)
}

fn new_sign_up_session(
  id: Int,
  email: String,
  secret_hash: BitArray,
  code: String,
  email_address_verified_at: option.Option(timestamp.Timestamp),
  created_at: timestamp.Timestamp,
) {
  let id = sign_up_session.SignUpSessionId(id)
  let email = user.Email(email)
  let secret_hash = session.SessionSecretHash(secret_hash)
  let email_verification_code = sign_up_session.EmailVerificationCode(code)

  sign_up_session.SignUpSession(
    id,
    email,
    secret_hash,
    email_verification_code,
    email_address_verified_at,
    created_at,
  )
}
