-- name: CreateSignUpSession :one
insert into sign_up_sessions (secret_hash, email_address, email_address_verification_code)
values ($1, $2, $3)
returning *;

-- name: GetSignUpSessionByID :one
select * from sign_up_sessions where id = $1 and created_at > now() - interval '24 hours';

-- name: DeleteSignUpSession :one
delete from sign_up_sessions where id = $1 returning *;

-- name: VerifySignUpSession :one
update 
  sign_up_sessions 
set 
  email_address_verified_at = now() 
where 
  id = $1 
  and email_address_verified_at is null 
returning 
  *;
