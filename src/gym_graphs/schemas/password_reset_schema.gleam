import formal/form.{type Form}
import gleam/string
import gym_graphs/domains/user.{type Email}

pub type ResetPasswordSchema {
  ResetPasswordSchema(email: Email)
}

// pub type VerifyEmailCodeForm {
//   VerifyEmailCodeForm(code: String)
// }

// pub type SetNewPasswordForm {
//   SetNewPasswordForm(password: String)
// }

pub fn start() -> Form(ResetPasswordSchema) {
  let schema = {
    use email <- form.field("email", user.parse_email())

    form.success(ResetPasswordSchema(email:))
  }

  form.new(schema)
}
// pub fn get_verify_form() -> Form(VerifyEmailCodeForm) {
//   let schema = {
//     use code <- form.field("code", {
//       form.parse_string
//       |> form.map(string.uppercase)
//       |> form.check_not_empty
//       |> form.check_string_length_more_than(7)
//       |> form.check_string_length_less_than(9)
//     })

//     form.success(VerifyEmailCodeForm(code:))
//   }

//   form.new(schema) |> form.language(form.en_gb)
// }

// pub fn get_set_new_password_form() -> Form(SetNewPasswordForm) {
//   let schema = {
//     use password <- form.field("password", {
//       form.parse_string
//       |> form.check_not_empty
//       |> form.check_string_length_more_than(7)
//       |> form.check_string_length_less_than(72)
//     })

//     form.success(SetNewPasswordForm(password:))
//   }

//   form.new(schema) |> form.language(form.en_gb)
// }
