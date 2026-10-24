select id, name
from exercises
where user_id = $1 and ($2 = 0 or id < $2)
order by id desc
limit $3;
