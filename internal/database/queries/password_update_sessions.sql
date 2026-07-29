-- name: CreatePasswordUpdateSession :one
insert into password_update_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *;

-- name: GetPasswordUpdateSessionByID :one
select * from password_update_sessions where id = $1 and created_at > now() - interval '1 hour';

-- name: DeletePasswordUpdateSession :one
delete from password_update_sessions where id = $1 returning *;
