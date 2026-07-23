-- name: CreateSignUpSession :one
insert into sign_up_sessions (secret_hash, email_address, email_address_verification_code)
values ($1, $2, $3)
returning *;

-- name: GetSignUpSessionByID :one
select * from sign_up_sessions where id = $1;

-- name: DeleteSignUpSession :one
delete from sign_up_sessions where id = $1 returning *;
