select id, name
from tags
where id = $1
  and user_id = $2
