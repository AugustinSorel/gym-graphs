import gleam/bit_array
import gleam/int
import gleam/result
import gleam/string

pub type SessionToken {
  SessionToken(id: Int, secret: BitArray)
}

pub fn encode(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

pub fn decode(raw: String) -> Result(SessionToken, Nil) {
  use #(raw_id, raw_secret) <- result.try(case string.split(raw, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(Nil)
  })
  use id <- result.try(int.parse(raw_id))
  use secret <- result.map(bit_array.base64_decode(raw_secret))
  SessionToken(id:, secret:)
}
