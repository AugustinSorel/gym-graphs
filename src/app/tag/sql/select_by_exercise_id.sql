select t.id, t.name
from tags t
join exercise_tags et on et.tag_id = t.id
where et.exercise_id = $1
  and t.user_id = $2
order by t.name asc
