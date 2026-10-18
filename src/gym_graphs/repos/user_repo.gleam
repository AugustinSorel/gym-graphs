import gleam/option
import gleam/result
import gym_graphs/domains/account_deletion_session.{
  type AccountDeletionSessionId,
}
import gym_graphs/domains/password_reset_session.{type PasswordResetSessionId}
import gym_graphs/domains/password_update_session.{type PasswordUpdateSessionId}
import gym_graphs/domains/sign_up_session.{type SignUpSessionId}
import gym_graphs/domains/user.{
  type Email, type Name, type PasswordHash, type UserId,
}
import gym_graphs/repos/sql
import pog.{type Connection}

pub fn create(
  db: Connection,
  password_hash: PasswordHash,
  name: Name,
  sign_up_session_id: SignUpSessionId,
) {
  sql.create_user(db, password_hash.value, name.value, sign_up_session_id.value)
  |> result.map(fn(row) {
    let assert pog.Returned(count: 1, rows: [entity]) = row
    user.UserId(entity.id)
  })
}

pub fn select_by_email(db: Connection, email: Email) {
  sql.select_user_by_email(db, email.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) -> {
        new_user(
          entity.id,
          entity.name,
          entity.email_address,
          entity.password_hash,
        )
        |> option.Some()
      }
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn select_by_password_reset_session_id(
  db: Connection,
  id: PasswordResetSessionId,
) {
  sql.select_user_by_password_reset_session_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) ->
        new_user(
          entity.id,
          entity.name,
          entity.email_address,
          entity.password_hash,
        )
        |> option.Some()
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn select_by_id(db: Connection, id: UserId) {
  sql.select_user_by_id(db, id.value)
  |> result.map(fn(row) {
    case row {
      pog.Returned(count: _, rows: [entity, ..]) ->
        new_user(
          entity.id,
          entity.name,
          entity.email_address,
          entity.password_hash,
        )
        |> option.Some()
      pog.Returned(count: _, rows: []) -> option.None
    }
  })
}

pub fn delete_by_account_deletion_session_id(
  db: Connection,
  id: AccountDeletionSessionId,
) {
  sql.delete_user_by_account_deletion_session_id(db, id.value)
}

pub fn update_name_by_id(db: Connection, name: Name, id: UserId) {
  sql.update_user_name_by_id(db, name.value, id.value)
}

pub fn update_password_hash_by_password_reset_session_id(
  db: Connection,
  password_hash: PasswordHash,
  id: PasswordResetSessionId,
) {
  sql.update_user_password_hash_by_password_reset_session_id(
    db,
    password_hash.value,
    id.value,
  )
}

pub fn update_password_hash_by_password_update_session_id(
  db: Connection,
  password_hash: PasswordHash,
  id: PasswordUpdateSessionId,
) {
  sql.update_user_password_hash_by_password_update_session_id(
    db,
    password_hash.value,
    id.value,
  )
}

fn new_user(id: Int, name: String, email: String, password_hash: String) {
  let id = user.UserId(id)
  let password_hash = user.PasswordHash(password_hash)
  let email = user.Email(email)
  let name = user.Name(name)

  user.User(id:, name:, email:, password_hash:)
}
