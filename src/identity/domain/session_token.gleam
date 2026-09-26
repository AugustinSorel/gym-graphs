import gleam/bit_array
import gleam/int
import gleam/result
import gleam/string

pub opaque type SessionToken {
  SessionToken(id: Int, secret: BitArray)
}

pub fn encode(token: SessionToken) -> String {
  let encoded_secret = bit_array.base64_encode(token.secret, False)
  let id = int.to_string(token.id)

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

  SessionToken(id:, secret:)
}

pub fn id(session_token: SessionToken) {
  session_token.id
}

pub fn secret(session_token: SessionToken) {
  session_token.secret
}
