insert into exercise_tags (exercise_id, tag_id)
select $1, unnest($2::int[])
