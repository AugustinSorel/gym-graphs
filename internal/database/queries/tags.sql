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
