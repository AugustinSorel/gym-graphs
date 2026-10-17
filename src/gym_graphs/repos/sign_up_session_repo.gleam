import gleam/option
import gleam/result
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session.{type SignUpSessionId}
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
      pog.Returned(count: _, rows: [entity, ..]) -> {
        let id = entity.id |> sign_up_session.new_id
        let secret_hash = session.new_secret_hash(entity.secret_hash)
        let email_verification_code =
          sign_up_session.new_email_verification_code(
            entity.email_address_verification_code,
          )

        sign_up_session.new(
          id,
          secret_hash,
          email_verification_code,
          entity.email_address_verified_at,
          entity.created_at,
        )
        |> option.Some
      }
    }
  })
}

//FIX map
pub fn select_by_id(db: Connection, id: SignUpSessionId) {
  sql.select_sign_up_session_by_id(db, sign_up_session.id_to_int(id))
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: []) -> option.None
      pog.Returned(count: _, rows: [entity, ..]) -> {
        let id = entity.id |> sign_up_session.new_id
        let secret_hash = session.new_secret_hash(entity.secret_hash)
        let email_verification_code =
          sign_up_session.new_email_verification_code(
            entity.email_address_verification_code,
          )

        sign_up_session.new(
          id,
          secret_hash,
          email_verification_code,
          entity.email_address_verified_at,
          entity.created_at,
        )
        |> option.Some
      }
    }
  })
}

pub fn verify_by_id(db: Connection, id: SignUpSessionId) {
  sql.verify_sign_up_session_by_id(db, sign_up_session.id_to_int(id))
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: _) -> Nil
    }
  })
}
