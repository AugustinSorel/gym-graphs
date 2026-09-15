import domains/user/sql
import gleam/result
import pog.{type Connection}

pub fn check_if_email_is_available(db: Connection, email: String) {
  use user <- result.try(sql.check_email_availability(db, email))

  case user {
    pog.Returned(_, []) -> Ok(Nil)
    pog.Returned(_, [_, ..]) ->
      Error(pog.ConstraintViolated(
        message: "duplicate key value violates unique constraint \"users_email_key\"",
        constraint: "users_email_key",
        detail: "Key (email)=(example@domain.com) already exists.",
      ))
  }
}
