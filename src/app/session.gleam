import app/crypto
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/result
import gleam/string
import wisp.{type Request, type Response}

pub type SessionToken {
  SessionToken(id: Int, secret: BitArray)
}

pub fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

pub fn decode_token(raw: String) -> Result(SessionToken, Nil) {
  use #(raw_id, raw_secret) <- result.try({
    case string.split(raw, on: ".") {
      [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
      _ -> Error(Nil)
    }
  })

  use id <- result.try(int.parse(raw_id))

  use secret <- result.map(bit_array.base64_decode(raw_secret))

  SessionToken(id:, secret:)
}

pub fn set_cookie(
  res: Response,
  req: Request,
  name: String,
  value: String,
  max_age: Int,
) -> Response {
  wisp.set_cookie(res, req, name:, value:, security: wisp.Signed, max_age:)
}

pub fn clear_cookie(res: Response, req: Request, name: String) -> Response {
  wisp.set_cookie(res, req, name:, value: "", security: wisp.Signed, max_age: 0)
}

pub fn get_cookie(req: Request, name: String) {
  wisp.get_cookie(req, name:, security: wisp.Signed)
}

pub fn validate_token(token: SessionToken, secret_hash) {
  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(Nil))

  Ok(Nil)
}
