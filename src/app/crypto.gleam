import gleam/crypto
import gleam/int
import gleam/string

pub fn generate_session_secret() -> BitArray {
  crypto.strong_random_bytes(32)
}

pub fn hash_session_secret(secret: BitArray) -> BitArray {
  crypto.hash(crypto.Sha256, secret)
}

pub fn generate_email_verification_code() {
  let random_bytes = crypto.strong_random_bytes(4)

  let assert <<n:unsigned-big-size(32)>> = random_bytes

  let code = n % 100_000_000

  string.pad_start(int.to_string(code), 8, "0")
}
