delete from sets
using exercises
where sets.id = $1
  and sets.exercise_id = $2
  and exercises.id = sets.exercise_id
  and exercises.user_id = $3
returning sets.id;
