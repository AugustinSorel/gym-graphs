select id, name, created_at, updated_at
from tags
where user_id = $1
order by id;
