select count(*)::int as total_count
from tags
where user_id = $1;
