insert into exercise_tags (exercise_id, tag_id, created_at)
select *
from unnest($1::integer[], $2::integer[], $3::timestamp[]);
