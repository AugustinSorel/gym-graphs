select 1 as exists from users  where email_address = $1 limit 1;
