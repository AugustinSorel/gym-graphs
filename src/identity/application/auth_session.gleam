import gleam/result
import identity/domain/auth_session
import identity/domain/repo.{type AuthSessionRepo}
import identity/domain/session_token.{type DecodeError}
import pog.{type QueryError}

pub type AuthSessionError {
  InvalidToken(DecodeError)
  DatabaseFailure(QueryError)
  VerifyFailure
}

pub fn authenticate(auth_session_repo: AuthSessionRepo, raw_token) {
  use token <- result.try(
    session_token.decode(raw_token)
    |> result.map_error(InvalidToken),
  )

  use auth_session <- result.try({
    token
    |> session_token.id()
    |> session_token.id_to_int()
    |> auth_session.new_id()
    |> auth_session_repo.select_by_id()
    |> result.map_error(DatabaseFailure)
  })

  auth_session.verify(auth_session, token)
  |> result.replace_error(VerifyFailure)
}
