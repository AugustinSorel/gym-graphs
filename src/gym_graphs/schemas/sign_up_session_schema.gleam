import formal/form.{type Form}
import gym_graphs/domains/sign_up_session.{type EmailVerificationCode}
import gym_graphs/domains/user.{type Email}

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
