import domains/user/user
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

pub fn get_weight_unit_form() {
  form.new({
    use weight_unit <- form.field("weight_unit", {
      form.parse(fn(input) {
        case input {
          ["kg", ..] -> Ok(user.Kg)
          ["lbs", ..] -> Ok(user.Lbs)
          _ -> Error(#(user.Kg, "weight unit must be kg or lbs"))
        }
      })
    })

    form.success(weight_unit)
  })
}
