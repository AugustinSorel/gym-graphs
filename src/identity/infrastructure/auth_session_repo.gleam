import gleam/result
import identity/domain/auth_session
import identity/infrastructure/sql
import kernel/db
import pog.{type Connection}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_auth_session_by_id(db, id)
  |> db.extract_entity
  |> result.map(fn(row) {
    auth_session.new(
      auth_session.new_id(row.id),
      // user_id: row.user_id,
    // secret_hash: row.secret_hash,
    // last_active_at: row.last_active_at,
    )
  })
}
