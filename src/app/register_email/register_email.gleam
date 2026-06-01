import app/crypto
import app/sign_up_session/sql
import app/user/sql as user_sql
import gleam/result
import pog

pub type RegisterEmailError {
  EmailAlreadyTaken
  DatabaseError(pog.QueryError)
  UnexpectedDatabaseResult
}

pub type SignUpSession {
  SignUpSession(id: Int, secret: BitArray, verification_code: String)
}

pub fn register(
  db: pog.Connection,
  email: String,
) -> Result(SignUpSession, RegisterEmailError) {
  use _ <- result.try(ensure_email_available(db, email))

  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  use session <- result.try(
    sql.create_sign_up_session(db, secret_hash, email, verification_code)
    |> result.map_error(DatabaseError)
    |> result.try(fn(r) {
      case r {
        pog.Returned(_, [session, ..]) -> Ok(session)
        pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
      }
    }),
  )
  Ok(SignUpSession(id: session.id, secret:, verification_code:))
}

fn ensure_email_available(
  db: pog.Connection,
  email: String,
) -> Result(Nil, RegisterEmailError) {
  use result <- result.try(
    user_sql.select_user_by_email_address(db, email)
    |> result.map_error(DatabaseError),
  )
  case result {
    pog.Returned(_, []) -> Ok(Nil)
    pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
  }
}
