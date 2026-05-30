update 
  sign_up_sessions 
set 
  email_address_verified_at = now() 
where 
  id = $1 
  and email_address_verified_at is null 
returning 
  *;
