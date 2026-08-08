-- name: GetSetsByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, updated_at, created_at
from sets
where exercise_id = $1
order by created_at asc;
