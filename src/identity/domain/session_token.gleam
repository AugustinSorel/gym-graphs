import gleam/bit_array
import gleam/int
import gleam/result
import gleam/string

pub opaque type SessionTokenId {
  SessionTokenId(value: Int)
}

pub opaque type SessionToken {
  SessionToken(id: SessionTokenId, secret: BitArray)
}

pub fn new_id(raw: Int) {
  SessionTokenId(raw)
}

pub fn new(id: SessionTokenId, secret: BitArray) {
  SessionToken(id:, secret:)
}

pub fn encode(token: SessionToken) -> String {
  let encoded_secret = bit_array.base64_encode(token.secret, False)
  let id = int.to_string(token.id.value)

  id <> "." <> encoded_secret
}

pub type DecodeError {
  MalformedToken
  InvalidId
  InvalidSecret
}

pub fn decode(raw: String) -> Result(SessionToken, DecodeError) {
  use #(raw_id, raw_secret) <- result.try(case string.split(raw, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(MalformedToken)
  })

  use id <- result.try(
    int.parse(raw_id)
    |> result.replace_error(InvalidId),
  )

  use secret <- result.map(
    bit_array.base64_decode(raw_secret)
    |> result.replace_error(InvalidSecret),
  )

  SessionToken(id: new_id(id), secret:)
}

pub fn id(session_token: SessionToken) {
  session_token.id
}

pub fn id_to_int(id: SessionTokenId) {
  id.value
}

pub fn secret(session_token: SessionToken) {
  session_token.secret
}
