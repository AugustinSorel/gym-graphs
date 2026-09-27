import gleam/result
import identity/domain/email_address
import identity/domain/repo.{type SignUpSessionRepo, SignUpSessionRepo}
import identity/domain/session_secret
import identity/domain/sign_up_session.{
  type SignUpSessionId, type SignUpSessionStart,
}
import identity/domain/verification_code
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn create(db: Connection, request: SignUpSessionStart) {
  sql.create_sign_up_session(
    db,
    session_secret.hash_to_bit_array(request.secret_hash),
    email_address.to_string(request.email),
    verification_code.to_string(request.code),
  )
  |> db.extract_entity()
  |> result.map(fn(row) { sign_up_session.new_id(row.id) })
}

pub fn select_by_id(db: Connection, id: SignUpSessionId) {
  sql.select_sign_up_session_by_id(db, sign_up_session.id_to_int(id))
  |> db.extract_entity
  |> result.map(fn(row) {
    let assert Ok(email_address) = email_address.new(row.email_address)

    let assert Ok(code) =
      verification_code.new(row.email_address_verification_code)

    sign_up_session.new(
      email_address,
      session_secret.new_hash(row.secret_hash),
      code,
      row.email_address_verified_at,
    )
  })
}

pub fn new(db: Connection) -> SignUpSessionRepo {
  SignUpSessionRepo(create: create(db, _), select_by_id: select_by_id(db, _))
}
