-- name: CreateExercise :one
insert into exercises (user_id, name)
values ($1, $2)
returning *;

-- name: CreateExerciseTags :exec
insert into exercise_tags (exercise_id, tag_id)
select $1, unnest($2::int[]);
