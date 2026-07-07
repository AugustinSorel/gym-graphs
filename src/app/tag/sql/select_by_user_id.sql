select id, name
from tags
where user_id = $1
order by name asc
