select
  s.id,
  s.user_id,
  s.secret_hash,
  s.created_at,
  s.last_active_at,
  u.email_address
from auth_sessions s
join users u on u.id = s.user_id
where s.id = $1;
