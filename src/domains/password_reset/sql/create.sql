insert into password_reset_sessions (user_id, secret_hash, email_code_hash)
select users.id, $1, $2 from users
where users.email_address = $3
returning *
