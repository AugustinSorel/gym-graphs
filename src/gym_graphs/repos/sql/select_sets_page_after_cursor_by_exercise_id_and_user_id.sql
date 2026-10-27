select sets.id, sets.repetitions, sets.weight_in_g, sets.done_at
from sets
inner join exercises on exercises.id = sets.exercise_id
where exercises.id = $1
  and exercises.user_id = $2
  and (sets.done_at, sets.id) < ($3, $4)
order by sets.done_at desc, sets.id desc
limit $5;
