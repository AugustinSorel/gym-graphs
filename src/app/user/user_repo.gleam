import app/user/sql
import gleam/string
import pog.{type Connection}
import wisp

pub type UserRepoError {
  UserNotFound
  Database
}

pub fn select_by_email_address(db: Connection, email: String) {
  case sql.select_user_by_email_address(db, email) {
    Ok(pog.Returned(_count, [])) -> {
      Error(UserNotFound)
    }
    Ok(pog.Returned(_count, [user, ..])) -> {
      Ok(user)
    }
    Error(error) -> {
      wisp.log_error(
        "selecting user by email failed: " <> string.inspect(error),
      )
      Error(Database)
    }
  }
}

pub fn create(
  db: pog.Connection,
  password_hash: BitArray,
  password_salt: BitArray,
  id: Int,
) {
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
