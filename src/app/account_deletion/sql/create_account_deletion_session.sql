insert into account_deletion_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *
