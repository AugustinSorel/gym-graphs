import formal/form.{type Form}
import gym_graphs/domains/user.{type Email}

pub type SignInSchema {
  SignInSchema(email: Email, password: String)
}

pub fn sign_in() -> Form(SignInSchema) {
  let schema = {
    use email <- form.field("email", user.parse_email())
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
    })
    form.success(SignInSchema(email:, password:))
  }

  form.new(schema)
}
