import formal/form.{type Form}
import gym_graphs/domains/sign_up_session.{type EmailVerificationCode}
import gym_graphs/domains/user.{type Email, type PasswordHash}

pub type StartSchema {
  EmailRegisterSchema(email: Email)
}

pub fn parse_start() -> Form(StartSchema) {
  let schema = {
    use email <- form.field("email", user.parse_email())

    form.success(EmailRegisterSchema(email))
  }

  form.new(schema)
}

pub type VerifyEmailAddressSchema {
  VerifyEmailAddressSchema(code: EmailVerificationCode)
}

pub fn verify_email() -> Form(VerifyEmailAddressSchema) {
  let schema = {
    use code <- form.field(
      "code",
      sign_up_session.parse_email_verification_code(),
    )

    form.success(VerifyEmailAddressSchema(code:))
  }

  form.new(schema)
}

pub type SetPasswordSchema {
  SetPasswordSchema(password_hash: PasswordHash)
}

pub fn get_set_password_form() -> Form(SetPasswordSchema) {
  let schema = {
    use password_hash <- form.field("password", { user.parse_password() })

    form.success(SetPasswordSchema(password_hash:))
  }

  form.new(schema) |> form.language(form.en_gb)
}
