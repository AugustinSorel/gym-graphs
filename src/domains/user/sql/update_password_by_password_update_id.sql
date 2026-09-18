update users
set
    password_hash = $1
from auth_sessions
join password_update_sessions on password_update_sessions.auth_session_id = auth_sessions.id
where users.id = auth_sessions.user_id
  and auth_sessions.id = password_update_sessions.auth_session_id
  and password_update_sessions.id = $2
  and password_update_sessions.user_identity_verified_at is not null
returning users.id;
