import app/crypto
import app/db
import app/user/sql
import gleam/list
import gleam/result
import gleam/string
import pog.{type Connection, type QueryError}

/// The canonical domain type for weight units. Defined here once;
/// sql modules use their own generated copies internally as decode intermediaries.
pub type WeightUnit {
  Kg
  Lbs
}

/// Converts the squirrel-generated sql.WeightUnit into the canonical domain type.
pub fn weight_unit_of_sql(w: sql.WeightUnit) -> WeightUnit {
  case w {
    sql.Kg -> Kg
    sql.Lbs -> Lbs
  }
}

/// Converts the canonical domain WeightUnit back to the sql encoder value.
fn weight_unit_to_sql(w: WeightUnit) -> sql.WeightUnit {
  case w {
    Kg -> sql.Kg
    Lbs -> sql.Lbs
  }
}

pub type OneRepMaxAlgorithm {
  Adams
  Baechle
  Berger
  Brown
  Brzycki
  Epley
  Kemmler
  Landers
  Lombardi
  Mayhew
  Naclerio
  OConner
  Wathen
}

pub fn one_rep_max_algorithm_of_sql(
  a: sql.OneRepMaxAlgorithm,
) -> OneRepMaxAlgorithm {
  case a {
    sql.Adams -> Adams
    sql.Baechle -> Baechle
    sql.Berger -> Berger
    sql.Brown -> Brown
    sql.Brzycki -> Brzycki
    sql.Epley -> Epley
    sql.Kemmler -> Kemmler
    sql.Landers -> Landers
    sql.Lombardi -> Lombardi
    sql.Mayhew -> Mayhew
    sql.Naclerio -> Naclerio
    sql.Oconner -> OConner
    sql.Wathen -> Wathen
  }
}

fn one_rep_max_algorithm_to_sql(
  a: OneRepMaxAlgorithm,
) -> sql.OneRepMaxAlgorithm {
  case a {
    Adams -> sql.Adams
    Baechle -> sql.Baechle
    Berger -> sql.Berger
    Brown -> sql.Brown
    Brzycki -> sql.Brzycki
    Epley -> sql.Epley
    Kemmler -> sql.Kemmler
    Landers -> sql.Landers
    Lombardi -> sql.Lombardi
    Mayhew -> sql.Mayhew
    Naclerio -> sql.Naclerio
    OConner -> sql.Oconner
    Wathen -> sql.Wathen
  }
}

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

pub fn update_weight_unit(db: Connection, weight_unit: WeightUnit, id: Int) {
  sql.update_weight_unit(db, weight_unit_to_sql(weight_unit), id)
  |> db.extract_first_row
}

pub fn update_one_rep_max_algorithm(
  db: Connection,
  algorithm: OneRepMaxAlgorithm,
  id: Int,
) {
  sql.update_one_rep_max_algorithm(
    db,
    one_rep_max_algorithm_to_sql(algorithm),
    id,
  )
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
