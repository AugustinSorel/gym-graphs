import formal/form.{type Form}
import gleam/string

pub type EmailRegisterForm {
  //FIX
  EmailRegisterForm(email: String)
}

pub fn email_register() -> Form(EmailRegisterForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
      |> form.check_string_length_more_than(3)
    })

    form.success(EmailRegisterForm(email:))
  }

  form.new(schema)
}

pub type VerifyEmailAddressForm {
  //FIX
  VerifyEmailAddressForm(code: String)
}

pub fn verify_email_address() -> Form(VerifyEmailAddressForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailAddressForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub type SetPasswordForm {
  //FIX
  SetPasswordForm(password: String)
}

pub fn set_password() -> Form(SetPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}
