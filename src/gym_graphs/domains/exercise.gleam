import formal/form
import gleam/string

pub type ExerciseId {
  ExerciseId(value: Int)
}

pub type Name {
  Name(value: String)
}

pub fn parse_name() {
  form.parse_string
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(100)
  |> form.map(Name)
}
