insert into users (
  email_address, password_hash, 
  password_salt 
) 
select 
  email_address,
  $1,
  $2
from 
  sign_up_sessions 
where 
  id = $3 
  AND email_address_verified_at is not null 
returning 
  id, email_address
