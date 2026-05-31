import app/set_password/sql
import gleam/string
import pog
import wisp

pub type Error {
  Database
}

pub fn create_user(
  db: pog.Connection,
  email_address: String,
  password_hash: BitArray,
  password_salt: BitArray,
) -> Result(sql.CreateUserRow, Error) {
  case sql.create_user(db, email_address, password_hash, password_salt) {
    Ok(pog.Returned(_count, [user, ..])) -> {
      Ok(user)
    }
    Ok(pog.Returned(_count, _rows)) -> {
      wisp.log_error("unexpected returned by database in create user")
      Error(Database)
    }
    Error(error) -> {
      wisp.log_error("create user failed: " <> string.inspect(error))
      Error(Database)
    }
  }
}
