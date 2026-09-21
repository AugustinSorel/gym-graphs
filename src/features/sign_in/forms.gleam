import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/string

pub type SignInForm {
  SignInForm(email: String, password: String)
}

pub fn get_sign_in_form() -> Form(SignInForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
    })
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
    })
    form.success(SignInForm(email:, password:))
  }

  form.new(schema)
  |> form.language(fn(error: FieldError) -> String {
    case error {
      MustBeEmail -> "please enter a valid email address"
      _ -> form.en_gb(error)
    }
  })
}
