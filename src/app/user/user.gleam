import app/crypto
import app/db
import app/user/sql
import gleam/list
import gleam/result
import gleam/string
import pog.{type Connection, type QueryError}

pub type CheckIfEmailIsAvailable {
  EmailConflict
  CheckIfEmailIsAvailableDatabaseFailure(QueryError)
}

pub fn check_if_email_is_available(db: Connection, email: String) {
  sql.select_by_email(db, email)
  |> result.map_error(CheckIfEmailIsAvailableDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailConflict)
    }
  })
}

pub fn create(
  db: pog.Connection,
  password: String,
  name: String,
  session_id: Int,
) {
  let salt = crypto.generate_hashing_salt()
  let password_hash = crypto.hash_user_password(password, salt)

  sql.create(db, password_hash, salt, name, session_id)
  |> db.extract_first_row
}

pub fn infer_name_from_email(email: String) {
  email |> string.split(on: "@") |> list.first() |> result.unwrap("unknown")
}

pub fn select_by_email(db: Connection, email: String) {
  sql.select_by_email(db, email) |> db.extract_first_row
}

pub fn update_name(db: Connection, name: String, id: Int) {
  sql.update_name(db, name, id) |> db.extract_first_row
}

pub fn update_weight_unit(
  db: Connection,
  weight_unit: sql.WeightUnit,
  id: Int,
) {
  sql.update_weight_unit(db, weight_unit, id)
  |> db.extract_first_row
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_first_row
}

pub fn delete_by_account_deletion_id(db: Connection, id: Int) {
  sql.delete_by_account_deletion_id(db, id)
  |> db.extract_first_row
}

pub fn update_password_by_password_update_id(
  db: Connection,
  password_hash,
  salt,
  password_update_id: Int,
) {
  sql.update_password_by_password_update_id(
    db,
    password_hash,
    salt,
    password_update_id,
  )
  |> db.extract_first_row
}

pub fn update_password_by_password_reset_id(
  db: Connection,
  password_hash,
  salt,
  password_reset_id: Int,
) {
  sql.update_password_by_password_reset_id(
    db,
    password_hash,
    salt,
    password_reset_id,
  )
  |> db.extract_first_row
}

pub fn select_by_password_reset_id(db: Connection, id: Int) {
  sql.select_by_password_reset_id(db, id) |> db.extract_first_row
}
