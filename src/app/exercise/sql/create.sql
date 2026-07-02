insert into exercises (user_id, name)
values ($1, $2)
returning id, name
