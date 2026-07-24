-- name: GetUserByEmail :one
select * from users
where email_address = $1;

-- name: GetUserByID :one
select * from users
where id = $1;

-- name: CreateUser :one
insert into users (email_address, password_hash, password_salt, name)
select
    email_address,
    $1,
    $2,
    $3
from sign_up_sessions
where sign_up_sessions.id = $4 and email_address_verified_at is not null returning
    id, email_address;
