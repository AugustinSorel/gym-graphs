select distinct on (s.created_at::date)
  s.created_at,
  s.repetitions,
  s.weight_in_g
from sets s
join exercises e on e.id = s.exercise_id
where s.exercise_id = $1
  and e.user_id = $2
order by s.created_at::date asc, (s.weight_in_g::float * (1.0 + s.repetitions::float / 30.0)) desc
