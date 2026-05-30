import app/sign_up_session/sql
import gleam/string
import pog
import wisp

pub type Error {
  Database
}

pub fn create_sign_up_session(
  db: pog.Connection,
  secret: BitArray,
  email: String,
  verification_code: String,
) -> Result(sql.CreateRow, Error) {
  case sql.create(db, secret, email, verification_code) {
    Ok(pog.Returned(_rows, [session, ..])) -> {
      Ok(session)
    }
    Ok(pog.Returned(_rows, _rows)) -> {
      wisp.log_error(
        "unexpected returned by database in create sign up session",
      )
      Error(Database)
    }
    Error(error) -> {
      wisp.log_error("create sign up session failed: " <> string.inspect(error))
      Error(Database)
    }
  }
}
