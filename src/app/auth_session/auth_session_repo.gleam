import app/auth_session/sql
import gleam/string
import pog
import wisp

pub type Error {
  Database
}

pub fn create(db: pog.Connection, user_id: Int, secret_hash: BitArray) {
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
