-- name: GetUserByEmail :one
select * from users
where email_address = $1;

-- name: GetUserByID :one
select * from users
where id = $1;

-- name: GetUserByPasswordResetSessionID :one
select users.* from users
join password_reset_sessions on password_reset_sessions.user_id = users.id
where password_reset_sessions.id = $1;

-- name: UpdateUserPasswordByPasswordResetSessionID :exec
update users
set
  password_hash = $1,
  password_salt = $2
from password_reset_sessions
where users.id = password_reset_sessions.user_id
    and password_reset_sessions.id = $3
    and password_reset_sessions.user_identity_verified_at is not null
returning password_reset_sessions.id;

-- name: UpdateUserPasswordByPasswordUpdateSessionID :exec
update users
set
    password_hash = $1,
    password_salt = $2
from auth_sessions
join password_update_sessions on password_update_sessions.auth_session_id = auth_sessions.id
where users.id = auth_sessions.user_id
  and auth_sessions.id = password_update_sessions.auth_session_id
  and password_update_sessions.id = $3
  and password_update_sessions.user_identity_verified_at is not null
returning users.id;

-- name: DeleteUserByAccountDeletionSessionID :one
delete from users
where id in (
    select auth_sessions.user_id
    from auth_sessions
    inner join account_deletion_sessions
        on auth_sessions.id = account_deletion_sessions.auth_session_id
    where account_deletion_sessions.id = $1
    and account_deletion_sessions.user_identity_verified_at is not null
)
returning *;

-- name: UpdateUserName :exec
update users
set name = $1
where id = $2;

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
