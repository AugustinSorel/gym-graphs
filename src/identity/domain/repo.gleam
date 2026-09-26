import identity/domain/auth_session.{type AuthSession, type AuthSessionId}
import pog.{type QueryError}

pub type AuthSessionRepo {
  AuthSessionRepo(
    select_by_id: fn(AuthSessionId) -> Result(AuthSession, QueryError),
  )
}
