import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/repo.{type SignUpSessionRepo, type UserRepo}
import identity/domain/session_token
import identity/domain/sign_up_session
import kernel/crypto

pub type CreateInput {
  CreateInput(email: EmailAddress)
}

pub fn create(
  user_repo: UserRepo,
  sign_up_session_repo: SignUpSessionRepo,
  input: CreateInput,
) {
  use Nil <- result.try(user_repo.check_email_available(input.email))

  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  use sign_up_session_id <- result.try({
    sign_up_session_repo.create(input.email, secret_hash, verification_code)
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
