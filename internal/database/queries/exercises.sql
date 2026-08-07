-- name: CreateExercise :one
insert into exercises (user_id, name)
values ($1, $2)
returning *;

-- name: CreateExerciseTags :exec
insert into exercise_tags (exercise_id, tag_id)
select $1, unnest($2::int[]);

-- name: GetExercisesPageByUserID :many
select * from exercises
where user_id = $1
  and index < $2
order by index desc
limit $3;

-- name: GetExercisesCountByUserID :one
select count(*) from exercises
where user_id = $1;
