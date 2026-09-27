import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/repo.{type SignUpSessionRepo, type UserRepo}
import identity/domain/session_secret
import identity/domain/session_token
import identity/domain/sign_up_session
import identity/domain/verification_code

pub type CreateInput {
  CreateInput(email: EmailAddress)
}

pub fn create(
  user_repo: UserRepo,
  sign_up_session_repo: SignUpSessionRepo,
  input: CreateInput,
) {
  use Nil <- result.try(user_repo.check_email_available(input.email))

  let secret = session_secret.generate()
  let secret_hash = session_secret.hash(secret)
  let code = verification_code.generate()

  use sign_up_session_id <- result.try({
    sign_up_session_repo.create(input.email, secret_hash, code)
  })

  // use Nil <- result.try(
  //   email.send(
  //     email: ctx.email,
  //     to: input.email,
  //     subject: "Your verification code - " <> verification_code,
  //     html: template.verification_code(verification_code),
  //   )
  //   |> result.map_error(VerificationCodeDeliveryFailed),
  // )

  sign_up_session.id_to_int(sign_up_session_id)
  |> session_token.new_id()
  |> session_token.new(secret)
  |> session_token.encode()
  |> Ok()
}
