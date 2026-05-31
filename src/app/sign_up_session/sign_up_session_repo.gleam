import app/sign_up_session/sql
import gleam/string
import pog.{type Connection}
import wisp

pub type SignUpSessionRepoError {
  Database
  NotFound
}

pub fn create(
  db: Connection,
  secret: BitArray,
  email: String,
  verification_code: String,
) {
  case sql.create_sign_up_session(db, secret, email, verification_code) {
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

pub fn select_by_id(db: pog.Connection, id: Int) {
  case sql.select_sign_up_session_by_id(db, id) {
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

pub fn set_email_address_verified_at_to_now(db: pog.Connection, id: Int) {
  case sql.set_email_address_verified_at_to_now(db, id) {
    Ok(pog.Returned(_count, [session, ..])) -> {
      Ok(session)
    }
    Ok(pog.Returned(_count, [])) -> {
      Error(NotFound)
    }
    Error(error) -> {
      wisp.log_error(
        "selecting sign up session by id failed: " <> string.inspect(error),
      )
      Error(Database)
    }
  }
}

pub fn delete_by_id(db: pog.Connection, id: Int) {
  case sql.delete_sign_up_session_by_id(db, id) {
    Ok(pog.Returned(_count, [])) -> {
      Ok(Nil)
    }
    Ok(pog.Returned(_count, _rows)) -> {
      wisp.log_error(
        "unexpected returned by database in delete sign up session by id",
      )

      Error(Database)
    }
    Error(error) -> {
      wisp.log_error(
        "selecting sign up session by id failed: " <> string.inspect(error),
      )
      Error(Database)
    }
  }
}
