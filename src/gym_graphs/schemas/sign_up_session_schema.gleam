import formal/form.{type Form}
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
