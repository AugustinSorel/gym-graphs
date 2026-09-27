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
  use row <- result.try({
    sql.select_sign_up_session_by_id(db, sign_up_session.id_to_int(id))
    |> db.extract_entity
  })

  use email_address <- result.try(
    email_address.new(row.email_address)
    |> result.replace_error(pog.PostgresqlError("", "", "")),
  )

  use code <- result.try(
    verification_code.new(row.email_address_verification_code)
    |> result.replace_error(pog.PostgresqlError("", "", "")),
  )

  Ok(sign_up_session.new(
    id,
    email_address,
    session_secret.new_hash(row.secret_hash),
    code,
    row.email_address_verified_at,
    row.created_at,
  ))
}

pub fn mark_email_as_verified(db: Connection, id: SignUpSessionId) {
  sql.mark_sign_up_session_email_as_verified(db, sign_up_session.id_to_int(id))
  |> result.replace(Nil)
}

pub fn new(db: Connection) -> SignUpSessionRepo {
  SignUpSessionRepo(
    create: create(db, _),
    select_by_id: select_by_id(db, _),
    mark_email_as_verified: mark_email_as_verified(db, _),
  )
}
