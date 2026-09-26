pub opaque type UserId {
  UserId(value: Int)
}

pub opaque type User {
  User(id: UserId)
}

pub fn new_id(raw: Int) {
  UserId(raw)
}

pub fn new(id: UserId) {
  User(id:)
}
