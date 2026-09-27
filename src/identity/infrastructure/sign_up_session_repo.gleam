import gleam/result
import identity/domain/email_address
import identity/domain/repo.{type SignUpSessionRepo, SignUpSessionRepo}
import identity/domain/session_secret
import identity/domain/sign_up_session.{type SignUpSession}
import identity/domain/verification_code
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn create(db: Connection, session: SignUpSession) {
  sql.create_sign_up_session(
    db,
    session_secret.hash_to_bit_array(sign_up_session.secret_hash(session)),
    email_address.to_string(sign_up_session.email(session)),
    verification_code.to_string(sign_up_session.code(session)),
  )
  |> db.extract_entity()
  |> result.map(fn(row) { sign_up_session.new_id(row.id) })
}

pub fn new(db: Connection) -> SignUpSessionRepo {
  SignUpSessionRepo(create: fn(session) { create(db, session) })
}
