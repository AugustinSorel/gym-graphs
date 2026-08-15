-- name: GetTagsByUserID :many
select * from tags
where user_id = $1
order by name asc;

-- name: CreateTag :one
insert into tags (user_id, name)
values ($1, $2)
returning *;

-- name: CreateTags :many
insert into tags (user_id, name)
select $1, unnest($2::text[])
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

-- name: UpsertTags :many
insert into tags (user_id, name)
select $1, unnest($2::text[])
on conflict (user_id, name) do update set name = excluded.name
returning id, user_id, name, updated_at, created_at;

-- name: GetAllExerciseTagNamesByUserID :many
select et.exercise_id, t.name
from exercise_tags et
inner join tags t on t.id = et.tag_id
inner join exercises e on e.id = et.exercise_id
where e.user_id = $1
order by et.exercise_id asc, t.name asc;
