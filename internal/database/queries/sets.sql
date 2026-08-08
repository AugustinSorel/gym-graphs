-- name: GetSetsByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, updated_at, created_at
from sets
where exercise_id = $1
order by created_at asc;

-- name: GetExerciseStatsByID :one
select
    count(*)::int                               as total_sets,
    coalesce(max(weight_in_g), 0)::int          as highest_weight_in_g,
    coalesce(sum(weight_in_g::bigint * repetitions::bigint), 0)::bigint as total_volume_in_g
from sets
where exercise_id = $1;

-- name: CreateSets :many
insert into sets (exercise_id, repetitions, weight_in_g)
select unnest($1::int[]), unnest($2::int[]), unnest($3::int[])
returning id, exercise_id, repetitions, weight_in_g, updated_at, created_at;
