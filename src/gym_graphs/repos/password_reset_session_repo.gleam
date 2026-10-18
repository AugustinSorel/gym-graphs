import gleam/option
import gleam/result
import gym_graphs/domains/password_reset_session.{
  type EmailVerificationCodeHash, type PasswordResetSessionId,
}
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
    let assert pog.Returned(count: _, rows: [entity]) = row
    entity.id
  })
}

pub fn select_by_id(db: Connection, id: PasswordResetSessionId) {
  sql.select_password_reset_session_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        let id = password_reset_session.PasswordResetSessionId(entity.id)
        let user_id = user.UserId(entity.user_id)
        let secret_hash = session.SessionSecretHash(entity.secret_hash)
        let email_code_hash =
          password_reset_session.EmailVerificationCodeHash(
            entity.email_code_hash,
          )

        password_reset_session.PasswordResetSession(
          id,
          user_id,
          secret_hash,
          email_code_hash,
          entity.user_identity_verified_at,
        )
        |> option.Some()
      }

      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn verify_by_id(db: Connection, id: PasswordResetSessionId) {
  sql.verify_password_reset_session_by_id(db, id.value)
}

pub fn delete_by_id(db: Connection, id: PasswordResetSessionId) {
  sql.delete_password_reset_session_by_id(db, id.value)
}
