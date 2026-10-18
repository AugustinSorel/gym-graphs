import formal/form.{type Form}
import gym_graphs/domains/user.{type Name}

pub type EditNameSchema {
  EditNameSchema(name: Name)
}

pub fn edit_name() -> Form(EditNameSchema) {
  let schema = {
    use name <- form.field("name", user.parse_name())

    form.success(EditNameSchema(name:))
  }

  form.new(schema)
}
