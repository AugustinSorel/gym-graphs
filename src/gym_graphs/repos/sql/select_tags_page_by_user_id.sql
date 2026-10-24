select id, name
from tags
where user_id = $1 and id > $2
order by id
limit $3;
