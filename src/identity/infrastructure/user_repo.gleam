import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/repo.{type UserRepo, UserRepo}
import identity/infrastructure/sql
import pog.{type Connection}

pub fn check_email_available(db: Connection, email: EmailAddress) {
  use user <- result.try({
    sql.check_email_available(db, email_address.to_string(email))
  })

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

pub fn new(db: Connection) -> UserRepo {
  UserRepo(check_email_available: check_email_available(db, _))
}
