insert into exercises (user_id, name)
select $1, unnest($2::text[])
returning id, name;
