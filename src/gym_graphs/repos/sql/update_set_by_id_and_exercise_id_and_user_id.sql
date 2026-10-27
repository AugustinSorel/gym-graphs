update sets
set repetitions = $4,
    weight_in_g = $5,
    done_at = $6
from exercises
where sets.id = $1
  and sets.exercise_id = $2
  and exercises.id = sets.exercise_id
  and exercises.user_id = $3
returning sets.id;
