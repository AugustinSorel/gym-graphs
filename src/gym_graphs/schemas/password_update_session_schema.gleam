import formal/form.{type Form}
import gym_graphs/domains/user.{type PasswordHash}

pub type VerifyPasswordSchema {
  VerifyPasswordSchema(password: String)
}

pub fn verify_password() -> Form(VerifyPasswordSchema) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(VerifyPasswordSchema(password:))
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
