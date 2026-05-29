insert into sign_up_sessions (
  secret_hash, email_address, email_address_verification_code 
) 
values 
  ($1, $2, $3);
