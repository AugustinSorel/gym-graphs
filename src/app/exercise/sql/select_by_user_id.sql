select id, name
from exercises
where user_id = $1
order by name asc
