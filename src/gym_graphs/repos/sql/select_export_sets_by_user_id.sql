select
    sets.id,
    sets.exercise_id,
    sets.repetitions,
    sets.weight_in_g,
    sets.done_at,
    sets.created_at,
    sets.updated_at
from sets
inner join exercises on exercises.id = sets.exercise_id
where exercises.user_id = $1
order by sets.done_at, sets.id;
