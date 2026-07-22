-- name: GetUserByEmail :one
select * from users
where email_address = $1;

-- name: CreateUser :one
insert into users (email_address, name, weight_unit, password_hash, password_salt)
values ($1, $2, $3, $4, $5)
returning *;
