import app/crypto
import app/sign_up_session/sql
import gleam/bool
import gleam/result
import pog

pub type VerifyEmailError {
  InvalidCode
  AlreadyVerified
  DatabaseError(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn verify(
  db: pog.Connection,
  session_id: Int,
  stored_code: String,
  submitted_code: String,
) -> Result(Nil, VerifyEmailError) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  echo "HERE"

  use <- bool.guard(when: !is_valid, return: Error(InvalidCode))

  mark_email_verified(db, session_id)
}

pub type CancelSignUpError {
  CancelDatabaseError(pog.QueryError)
}

pub fn cancel(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, CancelSignUpError) {
  sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(CancelDatabaseError)
  |> result.replace(Nil)
}

fn mark_email_verified(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, VerifyEmailError) {
  sql.set_email_address_verified_at_to_now(db, session_id)
  |> result.map_error(DatabaseError)
  |> result.try(fn(result) {
    case result {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(AlreadyVerified)
    }
  })
}
