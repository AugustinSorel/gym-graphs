import app/crypto
import app/register_email/register_email_error.{
  DatabaseFailure, DuplicateEmail, UnexpectedDatabaseResult,
}
import app/register_email/register_email_ui.{type EmailRegisterForm}
import app/sign_up_session/sql
import app/user/sql as user_sql
import gleam/result
import pog.{type Connection}

pub type SignUpSession {
  SignUpSession(id: Int, secret: BitArray, verification_code: String)
}

pub fn register(db: Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sql.create_sign_up_session(db, secret_hash, email, verification_code)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
    }
  })
  |> result.map(fn(session) {
    SignUpSession(id: session.id, secret:, verification_code:)
  })
}

pub fn ensure_available(db: Connection, input: EmailRegisterForm) {
  user_sql.select_user_by_email_address(db, input.email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(DuplicateEmail)
    }
  })
}
