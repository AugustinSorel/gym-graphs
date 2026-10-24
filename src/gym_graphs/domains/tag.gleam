import formal/form
import gleam/string

pub type TagId {
  TagId(value: Int)
}

pub type Name {
  Name(value: String)
}

pub type Tag {
  Tag(id: TagId, name: Name)
}

pub fn parse_name() {
  form.parse_string
  |> form.map(string.trim)
  |> form.check_not_empty
  |> form.check_string_length_less_than(100)
  |> form.map(Name)
}
