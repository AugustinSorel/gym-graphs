import gleam/bit_array
import gleam/crypto
import gleam/int

pub opaque type SessionSecret {
  SessionSecret(value: BitArray)
}

pub fn generate_secret() {
  crypto.strong_random_bytes(32) |> SessionSecret
}

pub opaque type SessionSecretHash {
  SessionSecretHash(value: BitArray)
}

pub fn hash_secret(secret: SessionSecret) {
  crypto.hash(crypto.Sha256, secret.value) |> SessionSecretHash
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
