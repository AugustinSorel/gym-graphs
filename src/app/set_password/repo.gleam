import app/set_password/sql
import gleam/string
import pog
import wisp

pub type Error {
  Database
}

pub fn create_user(
  db: pog.Connection,
  password_hash: BitArray,
  password_salt: BitArray,
  id: Int,
) -> Result(sql.CreateUserRow, Error) {
  case sql.create_user(db, password_hash, password_salt, id) {
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

pub fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) -> Result(sql.CreateAuthSessionRow, Error) {
  case sql.create_auth_session(db, user_id, secret_hash) {
    Ok(pog.Returned(_count, [session, ..])) -> {
      Ok(session)
    }
    Ok(pog.Returned(_count, _rows)) -> {
      wisp.log_error("unexpected returned by database in create auth session")
      Error(Database)
    }
    Error(error) -> {
      wisp.log_error("create auth session failed:" <> string.inspect(error))
      Error(Database)
    }
  }
}
