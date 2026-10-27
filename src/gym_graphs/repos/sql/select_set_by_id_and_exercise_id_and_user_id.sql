select sets.id, sets.repetitions, sets.weight_in_g, sets.done_at
from sets
inner join exercises on exercises.id = sets.exercise_id
where sets.id = $1
  and sets.exercise_id = $2
  and exercises.user_id = $3;
