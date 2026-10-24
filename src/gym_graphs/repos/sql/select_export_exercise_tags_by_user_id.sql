select exercise_tags.exercise_id, exercise_tags.tag_id, exercise_tags.created_at
from exercise_tags
inner join exercises on exercises.id = exercise_tags.exercise_id
inner join tags on tags.id = exercise_tags.tag_id
where exercises.user_id = $1 and tags.user_id = $1
order by exercise_tags.exercise_id, exercise_tags.tag_id;
