import formal/form.{type Form}
import gleam/result
import gleam/string
import gym_graphs/domains/password_reset_session.{type EmailVerificationCode}
import gym_graphs/domains/user.{type Email, type PasswordHash}

pub type ResetPasswordSchema {
  ResetPasswordSchema(email: Email)
}

pub fn start() -> Form(ResetPasswordSchema) {
  let schema = {
    use email <- form.field("email", user.parse_email())

    form.success(ResetPasswordSchema(email:))
  }

  form.new(schema)
}

pub type VerifyEmailCodeSchema {
  VerifyEmailCodeSchema(code: EmailVerificationCode)
}

pub fn verify() -> Form(VerifyEmailCodeSchema) {
  let schema = {
    use code <- form.field("code", {
      password_reset_session.parse_email_verification_code()
    })

    form.success(VerifyEmailCodeSchema(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub type SetNewPasswordSchema {
  SetNewPasswordSchema(password: PasswordHash)
}

pub fn set_new_password() -> Form(SetNewPasswordSchema) {
  let schema = {
    use password <- form.field("password", user.parse_password())

    form.success(SetNewPasswordSchema(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}
