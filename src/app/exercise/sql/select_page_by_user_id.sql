select id, name, index
from exercises
where user_id = $1
  and index > $2
order by index asc
limit $3
