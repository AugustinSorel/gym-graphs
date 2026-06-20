update account_deletion_sessions set user_identity_verified_at = now() where id = $1 and user_identity_verified_at is null returning *;
