-- name: GetSetsByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, updated_at, created_at
from sets
where exercise_id = $1
order by created_at asc;

-- name: GetSetsPageByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, updated_at, created_at
from sets
where exercise_id = $1
  and id < $2
order by id desc
limit $3;

-- name: GetLastSetByExerciseID :one
select id, exercise_id, repetitions, weight_in_g, updated_at, created_at
from sets
where exercise_id = $1
order by created_at desc
limit 1;

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

-- name: SeedCreateSets :exec
insert into sets (exercise_id, repetitions, weight_in_g, created_at, updated_at)
select $1, unnest($2::int[]), unnest($3::int[]), unnest($4::timestamptz[]), unnest($4::timestamptz[]);
