import app/crypto
import app/db
import domains/user/sql
import gleam/list
import gleam/result
import gleam/string
import gleam/time/timestamp
import pog.{type Connection}

pub type WeightUnit {
  Kg
  Lbs
}

pub type User {
  User(
    id: Int,
    name: String,
    email_address: String,
    created_at: timestamp.Timestamp,
    password_hash: String,
    weight_unit: WeightUnit,
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

fn weight_unit_from_sql(w: sql.WeightUnit) -> WeightUnit {
  case w {
    sql.Kg -> Kg
    sql.Lbs -> Lbs
  }
}

fn weight_unit_to_sql(w: WeightUnit) -> sql.WeightUnit {
  case w {
    Kg -> sql.Kg
    Lbs -> sql.Lbs
  }
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_entity
  |> result.map(fn(row) {
    User(
      id: row.id,
      name: row.name,
      password_hash: row.password_hash,
      email_address: row.email_address,
      weight_unit: weight_unit_from_sql(row.weight_unit),
      created_at: row.created_at,
    )
  })
}

pub fn delete_by_account_deletion_id(db: Connection, id: Int) {
  sql.delete_by_account_deletion_id(db, id)
}

pub fn rename(db: Connection, name: String, id: Int) {
  sql.rename(db, name, id)
}

pub fn update_weight_unit(db: Connection, weight_unit: WeightUnit, id: Int) {
  sql.update_weight_unit(db, weight_unit_to_sql(weight_unit), id)
}
