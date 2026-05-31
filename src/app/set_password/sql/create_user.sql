insert into users (email_address, password_hash, password_salt)
values ($1, $2, $3)
returning *;
