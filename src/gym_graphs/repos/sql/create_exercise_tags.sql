insert into exercise_tags (exercise_id, tag_id)
select $1, id
from tags
where user_id = $2 and id = any($3::integer[])
returning tag_id;
