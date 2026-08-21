-- name: GetSetsByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
order by done_at asc;

-- name: GetSetsPageByExerciseID :many
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
  and (done_at < $2 or (done_at = $2 and id < $3))
order by done_at desc, id desc
limit $4;

-- name: GetLastSetByExerciseID :one
select id, exercise_id, repetitions, weight_in_g, done_at, updated_at, created_at
from sets
where exercise_id = $1
order by done_at desc
limit 1;

-- name: GetRepsRangeByExerciseID :one
select
    count(*) filter (where repetitions between 1 and 5)::int   as reps_1_5,
    count(*) filter (where repetitions between 6 and 8)::int   as reps_6_8,
    count(*) filter (where repetitions between 9 and 12)::int  as reps_9_12,
    count(*) filter (where repetitions >= 13)::int             as reps_13_plus
from sets
where exercise_id = $1
  and repetitions > 0;

-- name: GetExerciseStatsByID :one
select
    count(*)::int                                                              as total_sets,
    count(distinct date_trunc('day', done_at))::int                            as total_sessions,
    coalesce(avg(repetitions), 0)::float8                                      as avg_reps,
    coalesce(max(weight_in_g::bigint * repetitions::bigint), 0)::bigint        as best_set_volume_in_g
from sets
where exercise_id = $1;

-- name: GetBestSetByExerciseID :one
select weight_in_g, repetitions
from sets
where exercise_id = $1
  and weight_in_g > 0
  and repetitions > 0
order by weight_in_g::bigint * repetitions::bigint desc
limit 1;

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

-- name: GetAllSetsByUserID :many
select s.id, s.exercise_id, s.repetitions, s.weight_in_g, s.done_at, s.updated_at, s.created_at
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
order by s.exercise_id asc, s.done_at asc;

-- name: GetUserStatsByUserIDLast7Days :one
select
    count(s.id)::int                                                              as total_sets,
    coalesce(sum(s.weight_in_g::bigint * s.repetitions::bigint), 0)::bigint      as total_volume_in_g,
    coalesce(sum(s.weight_in_g::bigint), 0)::bigint                              as total_weight_in_g,
    count(distinct s.exercise_id)::int                                            as exercises_count
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
  and s.done_at >= date_trunc('day', now()) - interval '6 days';

-- name: GetUserStatsByUserID :one
select
    count(s.id)::int                                                              as total_sets,
    coalesce(sum(s.weight_in_g::bigint * s.repetitions::bigint), 0)::bigint      as total_volume_in_g,
    coalesce(sum(s.weight_in_g::bigint), 0)::bigint                              as total_weight_in_g,
    count(distinct s.exercise_id)::int                                            as exercises_count
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1;

-- name: GetSessionFrequencyLast8WeeksByExerciseID :many
select
    date_trunc('week', done_at)::date          as week_start,
    count(distinct date_trunc('day', done_at))::int as session_count
from sets
where exercise_id = $1
  and done_at >= date_trunc('week', now()) - interval '7 weeks'
group by week_start
order by week_start asc;

-- name: GetVolumePerSessionLast7DaysByExerciseID :many
select
    date_trunc('day', done_at)::date            as session_date,
    sum(weight_in_g::bigint * repetitions::bigint)::bigint as volume_in_g
from sets
where exercise_id = $1
  and done_at >= date_trunc('day', now()) - interval '6 days'
group by session_date
order by session_date asc;

-- name: GetVolumePerDayLast7DaysByUserID :many
select
    date_trunc('day', s.done_at)::date                          as session_date,
    sum(s.weight_in_g::bigint * s.repetitions::bigint)::bigint  as volume_in_g
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
  and s.done_at >= date_trunc('day', now()) - interval '6 days'
group by session_date
order by session_date asc;

-- name: SeedCreateSets :exec
insert into sets (exercise_id, repetitions, weight_in_g, done_at, created_at, updated_at)
select $1, unnest($2::int[]), unnest($3::int[]), unnest($4::timestamptz[]), unnest($4::timestamptz[]), unnest($4::timestamptz[]);
