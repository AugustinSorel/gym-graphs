import formal/form.{type Form}
import gym_graphs/domains/user.{type Name, type WeightUnit}

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

pub fn weight_unit() -> Form(WeightUnit) {
  let schema = {
    use weight_unit <- form.field("weight_unit", user.parse_weight_unit())

    form.success(weight_unit)
  }

  form.new(schema)
}
