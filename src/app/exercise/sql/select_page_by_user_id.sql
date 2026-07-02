select id, name, index
from exercises
where user_id = $1
  and ($2 = -1 or index < $2)
order by index desc
limit $3
