import gleam/float
import gleam/time/duration

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

pub fn auth_session() -> Cookie {
  Cookie(
    "auth_session_token",
    duration.hours(24 * 7) |> duration.to_seconds() |> float.round(),
  )
}

pub fn sign_up_session() -> Cookie {
  Cookie(
    "sign_up_session_token",
    duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}
