-- name: GetSetsByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
order by done_at asc;

-- name: GetSetsPageByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
  and id < $2
order by done_at desc
limit $3;

-- name: GetLastSetByExerciseID :one
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
order by done_at desc
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
returning id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at;

-- name: GetSetByIDAndUserID :one
select s.id, s.exercise_id, s.repetitions, s.weight_in_g, s.done_at, s.updated_at, s.created_at
from sets s
join exercises e on e.id = s.exercise_id
where s.id = $1
  and e.user_id = $2;

-- name: UpdateSetByIDAndUserID :one
update sets s
set repetitions = $3, weight_in_g = $4, done_at = $5, updated_at = now()
from exercises e
where s.id = $1
  and s.exercise_id = e.id
  and e.user_id = $2
returning s.id, s.exercise_id, s.repetitions, s.weight_in_g, s.done_at, s.updated_at, s.created_at;

-- name: DeleteSetByIDAndUserID :exec
delete from sets
using exercises
where sets.id = $1
  and sets.exercise_id = exercises.id
  and exercises.user_id = $2;

-- name: SeedCreateSets :exec
insert into sets (exercise_id, repetitions, weight_in_g, done_at, created_at, updated_at)
select $1, unnest($2::int[]), unnest($3::int[]), unnest($4::timestamptz[]), unnest($4::timestamptz[]), unnest($4::timestamptz[]);
