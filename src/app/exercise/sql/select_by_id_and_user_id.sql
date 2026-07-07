select id, name
from exercises
where id = $1
  and user_id = $2
