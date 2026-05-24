import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/string

pub type Create {
  Create(email: String)
}

pub fn create() -> Form(Create) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
      |> form.check_string_length_more_than(3)
    })

    form.success(Create(email:))
  }

  form.new(schema) |> form.language(translate)
}

fn translate(error: FieldError) -> String {
  case error {
    MustBeEmail -> "please enter a valid email address"
    _ -> form.en_gb(error)
  }
}
