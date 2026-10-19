pub type TagId {
  TagId(value: Int)
}

pub type Name {
  Name(value: String)
}

pub type Tag {
  Tag(id: TagId, name: Name)
}
