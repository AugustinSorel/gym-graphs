select id
from users
where id = $1
for update;
