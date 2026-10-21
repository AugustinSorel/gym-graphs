select
    exists(select 1 from tags where user_id = users.id) as has_tags,
    exists(select 1 from exercises where user_id = users.id) as has_exercises
from users
where id = $1;
