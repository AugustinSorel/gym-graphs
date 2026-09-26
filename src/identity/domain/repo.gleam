import identity/domain/auth_session.{type AuthSession, type AuthSessionId}
import identity/domain/email_address.{type EmailAddress}
import identity/domain/sign_up_session.{type SignUpSessionId}
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
    create: fn(EmailAddress, BitArray, String) ->
      Result(SignUpSessionId, QueryError),
  )
}
