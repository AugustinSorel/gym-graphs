insert into sign_up_sessions (
    secret_hash,
    email_address,
    email_address_verification_code
)
select
    $1,
    $2,
    $3
where not exists (
    select 1
    from users
    where email_address = $2
)
returning *;
