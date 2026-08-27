-- name: CreateAuthSession :one
insert into auth_sessions (user_id, secret_hash)
values ($1, $2)
returning *;

-- name: GetAuthSessionByID :one
select * from auth_sessions where id = $1;

-- name: DeleteAuthSession :exec
delete from auth_sessions where id = $1;
