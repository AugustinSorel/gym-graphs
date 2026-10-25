select tags.id, tags.name
from exercise_tags
inner join exercises on exercises.id = exercise_tags.exercise_id
inner join tags on tags.id = exercise_tags.tag_id
where exercises.id = $1
  and exercises.user_id = $2
  and tags.user_id = $2
order by tags.name, tags.id;
