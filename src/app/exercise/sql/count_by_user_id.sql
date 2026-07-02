select count(*)::int as count
from exercises
where user_id = $1
  and ($2 = '' or name ilike '%' || $2 || '%')
