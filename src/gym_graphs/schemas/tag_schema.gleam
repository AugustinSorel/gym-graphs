import formal/form.{type Form}
import gym_graphs/domains/tag.{type Name}

pub type CreateTagSchema {
  CreateTagSchema(name: Name)
}

pub type RenameTagSchema {
  RenameTagSchema(name: Name)
}

pub fn create() -> Form(CreateTagSchema) {
  let schema = {
    use name <- form.field("name", tag.parse_name())

    form.success(CreateTagSchema(name:))
  }

  form.new(schema)
}

pub fn rename() -> Form(RenameTagSchema) {
  let schema = {
    use name <- form.field("name", tag.parse_name())

    form.success(RenameTagSchema(name:))
  }

  form.new(schema)
}
