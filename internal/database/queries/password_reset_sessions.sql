-- name: CreatePasswordResetSession :one
insert into password_reset_sessions (user_id, secret_hash, email_code_hash, email_code_salt)
select users.id, $1, $2, $3 from users
where users.email_address = $4
returning *;

-- name: GetPasswordResetSessionByID :one
select * from password_reset_sessions where id = $1 and created_at > now() - interval '1 hour';

-- name: DeletePasswordResetSession :one
delete from password_reset_sessions where id = $1 returning *;
