import formal/form.{type Form}
import gym_graphs/domains/exercise.{type Name}

pub type CreateExerciseSchema {
  CreateExerciseSchema(name: Name, tag_ids: List(Int))
}

pub fn create() -> Form(CreateExerciseSchema) {
  let schema = {
    use name <- form.field("name", exercise.parse_name())
    use tag_ids <- form.field(
      "tag_ids",
      form.parse_list(form.parse_int |> form.check_int_more_than(0)),
    )

    form.success(CreateExerciseSchema(name:, tag_ids:))
  }

  form.new(schema)
}
