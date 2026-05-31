import argus
import gleam/bit_array
import gleam/crypto
import gleam/int
import gleam/string

pub fn generate_session_secret() -> BitArray {
  crypto.strong_random_bytes(32)
}

pub fn hash_session_secret(secret: BitArray) -> BitArray {
  crypto.hash(crypto.Sha256, secret)
}

pub fn generate_email_verification_code() -> String {
  let random_bytes = crypto.strong_random_bytes(4)

  let assert <<n:unsigned-big-size(32)>> = random_bytes

  let code = n % 100_000_000

  string.pad_start(int.to_string(code), 8, "0")
}

pub fn validate_session_secret(a: BitArray, b: BitArray) -> Bool {
  crypto.secure_compare(a, b)
}

pub fn validate_verification_code(a: String, b: String) -> Bool {
  crypto.secure_compare(bit_array.from_string(a), bit_array.from_string(b))
}

pub fn generate_hashing_salt() -> BitArray {
  argus.gen_salt() |> bit_array.from_string
}

pub fn hash_user_password(password: String, salt: BitArray) {
  let assert Ok(salt) = bit_array.to_string(salt)

  let assert Ok(hashes) = argus.hasher() |> argus.hash(password, salt)

  hashes
}
