import formal/form.{type Form}

pub type VerifyPasswordForm {
  VerifyPasswordForm(password: String)
}

pub fn get_verify_password_form() -> Form(VerifyPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(VerifyPasswordForm(password:))
  }

  form.new(schema)
}

pub type AccountDeletionConfirmForm {
  AccountDeletionConfirmForm
}

pub fn get_account_deletion_form() -> Form(AccountDeletionConfirmForm) {
  AccountDeletionConfirmForm
  |> form.success
  |> form.new
}
