import app/crypto
import app/db
import domains/sign_up_session/sql
import gleam/result
import pog

pub fn create(db: pog.Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sql.create(db, secret_hash, email, verification_code)
  |> db.extract_entity
  |> result.map(fn(session) { #(session.id, secret, verification_code) })
}
