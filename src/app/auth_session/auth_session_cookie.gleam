import gleam/bit_array
import gleam/int
import wisp

const name = "auth_session_token"

pub fn set(res, req, value) {
  wisp.set_cookie(
    res,
    req,
    name:,
    value:,
    security: wisp.Signed,
    max_age: 60 * 60 * 24,
  )
}

pub fn clear(res, req) {
  wisp.set_cookie(res, req, name:, value: "", security: wisp.Signed, max_age: 0)
}

pub fn encode(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}
