import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/string

pub type ResetPasswordForm {
  ResetPasswordForm(email: String)
}

pub type VerifyEmailCodeForm {
  VerifyEmailCodeForm(code: String)
}

pub type SetNewPasswordForm {
  SetNewPasswordForm(password: String)
}

pub fn get_password_reset_form() -> Form(ResetPasswordForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
    })

    form.success(ResetPasswordForm(email:))
  }

  form.new(schema)
  |> form.language(fn(error: FieldError) -> String {
    case error {
      MustBeEmail -> "please enter a valid email address"
      _ -> form.en_gb(error)
    }
  })
}

pub fn get_verify_form() -> Form(VerifyEmailCodeForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.map(string.uppercase)
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailCodeForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub fn get_set_new_password_form() -> Form(SetNewPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetNewPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}
