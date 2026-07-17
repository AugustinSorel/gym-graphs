select
  s.id,
  s.repetitions,
  s.weight_in_g,
  s.created_at,
  e.id as exercise_id,
  e.name as exercise_name
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
order by e.name asc, s.created_at asc
