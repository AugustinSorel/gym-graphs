import identity/domain/auth_session.{type AuthSession, type AuthSessionId}
import identity/domain/email_address.{type EmailAddress}
import identity/domain/sign_up_session.{
  type SignUpSession, type SignUpSessionId, type SignUpSessionStart,
}
import pog.{type QueryError}

pub type AuthSessionRepo {
  AuthSessionRepo(
    select_by_id: fn(AuthSessionId) -> Result(AuthSession, QueryError),
  )
}

pub type UserRepo {
  UserRepo(check_email_available: fn(EmailAddress) -> Result(Nil, QueryError))
}

pub type SignUpSessionRepo {
  SignUpSessionRepo(
    create: fn(SignUpSessionStart) -> Result(SignUpSessionId, QueryError),
    select_by_id: fn(SignUpSessionId) -> Result(SignUpSession, QueryError),
    mark_email_as_verified: fn(SignUpSessionId) -> Result(Nil, QueryError),
  )
}
