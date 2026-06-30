insert into password_update_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *
