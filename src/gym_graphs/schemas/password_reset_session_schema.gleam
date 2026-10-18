import formal/form.{type Form}
import gleam/result
import gleam/string
import gym_graphs/domains/password_reset_session.{type EmailVerificationCode}
import gym_graphs/domains/user.{type Email}

pub type ResetPasswordSchema {
  ResetPasswordSchema(email: Email)
}

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

pub type VerifyEmailCodeSchema {
  VerifyEmailCodeSchema(code: EmailVerificationCode)
}

pub fn verify() -> Form(VerifyEmailCodeSchema) {
  let schema = {
    use code <- form.field("code", {
      password_reset_session.parse_email_verification_code()
    })

    form.success(VerifyEmailCodeSchema(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}
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
