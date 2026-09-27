import gleam/result
import identity/domain/auth_session.{type AuthSessionId}
import identity/domain/repo.{type AuthSessionRepo, AuthSessionRepo}
import identity/domain/session_secret
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: AuthSessionId) {
  sql.select_auth_session_by_id(db, auth_session.id(id))
  |> db.extract_entity
  |> result.map(fn(row) {
    auth_session.new(
      auth_session.new_id(row.id),
      // user_id: row.user_id,
      session_secret.new_hash(row.secret_hash),
      row.last_active_at,
    )
  })
}

pub fn new(db: Connection) -> AuthSessionRepo {
  AuthSessionRepo(select_by_id: select_by_id(db, _))
}
