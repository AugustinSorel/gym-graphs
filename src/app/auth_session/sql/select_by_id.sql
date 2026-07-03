select
  s.id,
  s.user_id,
  s.secret_hash,
  s.created_at,
  s.last_active_at,
  u.email_address,
  u.name,
  u.created_at as user_created_at,
  u.weight_unit,
  u.one_rep_max_algorithm
from auth_sessions s
join users u on u.id = s.user_id
where s.id = $1;
