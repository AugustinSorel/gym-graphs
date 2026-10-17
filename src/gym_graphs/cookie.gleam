import gleam/float
import gleam/time/duration

pub type Cookie {
  Cookie(name: String, max_age: Int)
}

pub fn auth_session() {
  Cookie(
    name: "auth_session_token",
    max_age: duration.hours(24 * 7) |> duration.to_seconds() |> float.round(),
  )
}

pub fn sign_up_session() {
  Cookie(
    name: "sign_up_session_token",
    max_age: duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}
