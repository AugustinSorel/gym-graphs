import app/user/sql
import gleam/string
import pog
import wisp

pub type Error {
  UserNotFound
  Database
}

pub fn select_by_email_address(db: pog.Connection, email: String) {
  case sql.select_by_email_address(db, email) {
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
