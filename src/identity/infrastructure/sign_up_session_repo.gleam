import gleam/result
import identity/domain/email_address.{type EmailAddress}
import identity/domain/repo.{type SignUpSessionRepo, SignUpSessionRepo}
import identity/domain/sign_up_session
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn create(
  db: Connection,
  email: EmailAddress,
  secret_hash: BitArray,
  verification_code: String,
) {
  sql.create_sign_up_session(
    db,
    secret_hash,
    email_address.to_string(email),
    verification_code,
  )
  |> db.extract_entity()
  |> result.map(fn(row) { sign_up_session.new_id(row.id) })
}

pub fn new(db: Connection) -> SignUpSessionRepo {
  SignUpSessionRepo(create: fn(email_address, secret_hash, verification_code) {
    create(db, email_address, secret_hash, verification_code)
  })
}
