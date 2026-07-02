select id, name, index
from exercises
where user_id = $1
  and ($2 = -1 or index < $2)
  and ($4 = '' or name ilike '%' || $4 || '%')
order by index desc
limit $3
