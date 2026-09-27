import gleam/list
import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/event_publisher.{type EventPublisher}
import identity/domain/repo.{type SignUpSessionRepo, type UserRepo}
import identity/domain/session_token.{type DecodeError}
import identity/domain/sign_up_session
import pog.{type QueryError}

pub type CreateInput {
  CreateInput(email: EmailAddress)
}

pub fn start(
  user_repo: UserRepo,
  sign_up_session_repo: SignUpSessionRepo,
  event_publisher: EventPublisher,
  input: CreateInput,
) {
  use Nil <- result.try(user_repo.check_email_available(input.email))

  let request = sign_up_session.start(input.email)

  use sign_up_session_id <- result.try(sign_up_session_repo.create(request))

  list.each(request.events, event_publisher.publish)

  sign_up_session.id_to_int(sign_up_session_id)
  |> session_token.new_id()
  |> session_token.new(request.secret)
  |> session_token.encode()
  |> Ok()
}

pub type AuthenticateError {
  InvalidToken(DecodeError)
  DatabaseFailure(QueryError)
  VerifyFailure
}

pub fn authenticate(sign_up_session_repo: SignUpSessionRepo, raw_token) {
  use token <- result.try(
    session_token.decode(raw_token)
    |> result.map_error(InvalidToken),
  )

  use sign_up_session <- result.try({
    token
    |> session_token.id()
    |> session_token.id_to_int()
    |> sign_up_session.new_id()
    |> sign_up_session_repo.select_by_id()
    |> result.map_error(DatabaseFailure)
  })

  use Nil <- result.try(
    sign_up_session.verify(sign_up_session, token)
    |> result.replace_error(VerifyFailure),
  )

  Ok(sign_up_session)
}
