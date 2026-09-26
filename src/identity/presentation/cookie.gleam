pub opaque type Cookie {
  Cookie(name: String, max_age: Int)
}

pub fn new(name: String, max_age: Int) -> Cookie {
  Cookie(name:, max_age:)
}

pub fn name(cookie: Cookie) {
  cookie.name
}

pub fn max_age(cookie: Cookie) {
  cookie.max_age
}
