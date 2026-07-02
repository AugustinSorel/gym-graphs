select count(*)::int as count
from exercises
where user_id = $1
