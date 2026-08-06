-- name: GetTagsByUserID :many
select * from tags
where user_id = $1
order by name asc;

-- name: CreateTag :one
insert into tags (user_id, name)
values ($1, $2)
returning *;
