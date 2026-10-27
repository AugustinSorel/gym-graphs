select count(*)::int as total_count
from exercises
where user_id = $1;
