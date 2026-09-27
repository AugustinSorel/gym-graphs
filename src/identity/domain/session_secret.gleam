import kernel/crypto

pub opaque type SessionSecret {
  SessionSecret(bytes: BitArray)
}

pub opaque type SessionSecretHash {
  SessionSecretHash(bytes: BitArray)
}

pub fn generate() -> SessionSecret {
  SessionSecret(crypto.generate_session_secret())
}

pub fn new(bytes: BitArray) -> SessionSecret {
  SessionSecret(bytes)
}

pub fn to_bit_array(secret: SessionSecret) -> BitArray {
  secret.bytes
}

pub fn hash(secret: SessionSecret) -> SessionSecretHash {
  SessionSecretHash(crypto.hash_session_secret(secret.bytes))
}

pub fn new_hash(bytes: BitArray) -> SessionSecretHash {
  SessionSecretHash(bytes)
}

pub fn hash_to_bit_array(hash: SessionSecretHash) -> BitArray {
  hash.bytes
}

pub fn verify(secret: SessionSecret, expected_hash: SessionSecretHash) -> Bool {
  crypto.validate_session_secret(secret.bytes, expected_hash.bytes)
}
