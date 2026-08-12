-- name: GetTagsByUserID :many
select * from tags
where user_id = $1
order by name asc;

-- name: CreateTag :one
insert into tags (user_id, name)
values ($1, $2)
returning *;

-- name: GetTagByID :one
select * from tags
where id = $1;

-- name: UpdateTagName :one
update tags
set name = $1, updated_at = now()
where id = $2 and user_id = $3
returning *;

-- name: DeleteTag :exec
delete from tags
where id = $1 and user_id = $2;

-- name: GetTagsByExerciseID :many
select t.* from tags t
inner join exercise_tags et on et.tag_id = t.id
where et.exercise_id = $1
order by t.name asc;
