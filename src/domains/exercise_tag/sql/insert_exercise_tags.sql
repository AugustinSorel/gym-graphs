insert into exercise_tags (exercise_id, tag_id)
select unnest($1::int[]), unnest($2::int[]);
