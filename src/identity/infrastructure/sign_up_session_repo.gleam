import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/repo.{type SignUpSessionRepo, SignUpSessionRepo}
import identity/domain/session_secret.{type SessionSecretHash}
import identity/domain/sign_up_session
import identity/domain/verification_code.{type VerificationCode}
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn create(
  db: Connection,
  email: EmailAddress,
  secret_hash: SessionSecretHash,
  code: VerificationCode,
) {
  sql.create_sign_up_session(
    db,
    session_secret.hash_to_bit_array(secret_hash),
    email_address.to_string(email),
    verification_code.to_string(code),
  )
  |> db.extract_entity()
  |> result.map(fn(row) { sign_up_session.new_id(row.id) })
}

pub fn new(db: Connection) -> SignUpSessionRepo {
  SignUpSessionRepo(create: fn(email_address, secret_hash, code) {
    create(db, email_address, secret_hash, code)
  })
}
