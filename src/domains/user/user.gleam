import app/crypto
import app/db
import domains/user/sql
import gleam/list
import gleam/result
import gleam/string
import gleam/time/timestamp
import pog.{type Connection}

pub type User {
  User(
    id: Int,
    name: String,
    email: String,
    created_at: timestamp.Timestamp,
    // weight_unit: user.WeightUnit,
    // one_rep_max_algorithm: one_rep_max.Algorithm,
  )
}

pub fn check_if_email_is_available(db: Connection, email: String) {
  use user <- result.try(sql.check_email_availability(db, email))

  case user {
    pog.Returned(_, []) -> Ok(Nil)
    pog.Returned(_, [_, ..]) ->
      Error(pog.ConstraintViolated(
        message: "duplicate key value violates unique constraint \"users_email_key\"",
        constraint: "users_email_key",
        detail: "Key (email)=(example@domain.com) already exists.",
      ))
  }
}

pub fn infer_name_from_email(email: String) {
  email |> string.split(on: "@") |> list.first() |> result.unwrap("unknown")
}

pub fn create(
  db: pog.Connection,
  password: String,
  name: String,
  session_id: Int,
) {
  let password_hash = crypto.hash_user_password(password)

  sql.create(db, password_hash, name, session_id)
  |> db.extract_entity
}

pub fn select_by_email(db: Connection, email: String) {
  sql.select_by_email(db, email) |> db.extract_entity
}

pub fn select_by_password_reset_id(db: Connection, id: Int) {
  sql.select_by_password_reset_id(db, id) |> db.extract_entity
}

pub fn update_password_by_password_reset_id(
  db: Connection,
  password_hash,
  password_reset_id: Int,
) {
  sql.update_password_by_password_reset_id(db, password_hash, password_reset_id)
  |> db.extract_entity
}

pub fn update_password_by_password_update_id(
  db: Connection,
  password_hash,
  password_update_id: Int,
) {
  sql.update_password_by_password_update_id(
    db,
    password_hash,
    password_update_id,
  )
  |> db.extract_entity
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id) |> db.extract_entity
}
