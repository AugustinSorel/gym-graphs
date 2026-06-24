insert into users (
  email_address,
  password_hash, 
  password_salt,
  name
) 
select 
  email_address,
  $1,
  $2,
  $3
from 
  sign_up_sessions 
where 
  id = $4 
  and email_address_verified_at is not null 
returning 
  id, email_address
