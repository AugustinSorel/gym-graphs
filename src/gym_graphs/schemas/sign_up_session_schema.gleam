import formal/form.{type Form}
import gym_graphs/domains/user_domain.{type Email}

pub opaque type StartSchema {
  EmailRegisterSchema(email: Email)
}

pub fn parse_start() -> Form(StartSchema) {
  let schema = {
    use email <- form.field("email", user_domain.parse_email())

    form.success(EmailRegisterSchema(email))
  }

  form.new(schema)
}
