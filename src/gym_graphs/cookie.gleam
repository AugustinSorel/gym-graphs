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

pub fn password_reset() {
  Cookie(
    name: "password_reset_session_token",
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}

pub fn password_update() {
  Cookie(
    name: "password_update_session_token",
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}

pub fn account_deletion() {
  Cookie(
    name: "account_deletion_session_token",
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}
