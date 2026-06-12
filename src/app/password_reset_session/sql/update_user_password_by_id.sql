update users
set
  password_hash = $1,
  password_salt = $2
from password_reset_sessions
where users.id = password_reset_sessions.user_id
and password_reset_sessions.id = $3
and password_reset_sessions.user_identity_verified_at is not null
returning password_reset_sessions.id;
