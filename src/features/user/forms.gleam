import formal/form.{type Form}

pub type EditNameForm {
  EditNameForm(name: String)
}

pub fn get_edit_name_form() -> Form(EditNameForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(EditNameForm(name:))
  }

  form.new(schema)
}
