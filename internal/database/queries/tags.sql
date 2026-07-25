-- name: GetTagsByUserID :many
select * from tags
where user_id = $1
order by name asc;
