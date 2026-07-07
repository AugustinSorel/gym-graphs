update tags
set name = $3
where id = $1
  and user_id = $2
returning id, name
