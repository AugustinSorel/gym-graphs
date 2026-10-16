import gleam/bit_array
import gleam/bool
import gleam/crypto
import gleam/int
import gleam/result
import gleam/string

pub opaque type SessionSecret {
  SessionSecret(value: BitArray)
}

pub fn generate_secret() {
  crypto.strong_random_bytes(32) |> SessionSecret
}

pub opaque type SessionSecretHash {
  SessionSecretHash(value: BitArray)
}

pub fn new_secret_hash(value: BitArray) {
  SessionSecretHash(value:)
}

pub fn hash_secret(secret: SessionSecret) {
  crypto.hash(crypto.Sha256, secret.value) |> new_secret_hash
}

pub fn secret_hash_to_bit_array(hash: SessionSecretHash) {
  hash.value
}

pub opaque type EncodedToken {
  EncodedToken(value: String)
}

pub fn encode_token(id: Int, secret: SessionSecret) {
  let encoded_secret = bit_array.base64_encode(secret.value, False)
  { int.to_string(id) <> "." <> encoded_secret } |> EncodedToken
}

pub fn encoded_token_to_string(encoded_token: EncodedToken) {
  encoded_token.value
}

pub fn decode_token(raw) {
  use #(raw_id, raw_secret) <- result.try({
    case string.split(raw, on: ".") {
      [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
      _ -> Error(Nil)
    }
  })

  use id <- result.try(int.parse(raw_id))

  use secret <- result.map(bit_array.base64_decode(raw_secret))

  #(id, SessionSecret(secret))
}

pub fn verify(secret_hash: SessionSecretHash, secret: SessionSecret) {
  let is_secret_valid =
    crypto.secure_compare(hash_secret(secret).value, secret_hash.value)

  use <- bool.guard(when: !is_secret_valid, return: Error(Nil))

  Ok(Nil)
}
