import formal/form.{type Form}

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
