-- name: CreateExercise :one
insert into exercises (user_id, name)
values ($1, $2)
returning *;

-- name: CreateExerciseTags :exec
insert into exercise_tags (exercise_id, tag_id)
select $1, unnest($2::int[]);

-- name: GetExercisesPageByUserID :many
select
    e.id, e.user_id, e.name, e.index, e.updated_at, e.created_at,
    count(s.id)::int as sets_count
from exercises e
left join sets s on s.exercise_id = e.id
where e.user_id = $1
  and e.index < $2
group by e.id
order by e.index desc
limit $3;

-- name: GetExercisesCountByUserID :one
select count(*) from exercises
where user_id = $1;
