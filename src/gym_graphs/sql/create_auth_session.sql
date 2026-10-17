insert into auth_sessions (user_id, secret_hash) values ($1, $2) returning *;
