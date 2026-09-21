update users
set
  password_hash = $1
from password_reset_sessions
where users.id = password_reset_sessions.user_id
and password_reset_sessions.id = $2
and password_reset_sessions.user_identity_verified_at is not null
returning password_reset_sessions.id;
