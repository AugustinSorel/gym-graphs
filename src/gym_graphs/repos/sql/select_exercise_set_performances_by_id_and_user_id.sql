select sets.weight_in_g, sets.repetitions
from sets
inner join exercises on exercises.id = sets.exercise_id
where exercises.id = $1
  and exercises.user_id = $2
  and sets.weight_in_g > 0
  and sets.repetitions > 0;
