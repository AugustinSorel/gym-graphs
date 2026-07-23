-- name: CreateSignUpSession :one
insert into sign_up_sessions (secret_hash, email_address, email_address_verification_code)
values ($1, $2, $3)
returning *;

-- name: DeleteSignUpSession :one
delete from sign_up_sessions where id = $1 returning *;
