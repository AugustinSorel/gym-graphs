import app/verify_email_address/sql
import gleam/string
import pog
import wisp

pub type Error {
  NotFound
  Database
}

pub fn select_by_id(db: pog.Connection, id: Int) {
  case sql.select_by_id(db, id) {
    Ok(pog.Returned(_count, [])) -> {
      Error(NotFound)
    }
    Ok(pog.Returned(_count, [session, ..])) -> {
      Ok(session)
    }
    Error(error) -> {
      wisp.log_error(
        "selecting sign up session by id failed: " <> string.inspect(error),
      )
      Error(Database)
    }
  }
}
