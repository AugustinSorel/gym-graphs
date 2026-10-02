import formal/form.{type Form}
import identity/domain/email_address.{type EmailAddress}

pub type EmailRegisterForm {
  EmailRegisterForm(email: EmailAddress)
}

pub fn email_register() -> Form(EmailRegisterForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_string
      |> form.check(fn(value) {
        case email_address.new(value) {
          Ok(email) -> Ok(email_address.to_string(email))
          Error(email_address.Empty) -> Error("please enter your email address")
          Error(email_address.TooLong) -> Error("email address is too long")
          Error(email_address.MissingAtSign) ->
            Error("please enter a valid email address")
        }
      })
    })

    //FIXME
    let assert Ok(email) = email_address.new(email)

    form.success(EmailRegisterForm(email:))
  }

  form.new(schema)
}

pub type VerifyEmailAddressForm {
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
