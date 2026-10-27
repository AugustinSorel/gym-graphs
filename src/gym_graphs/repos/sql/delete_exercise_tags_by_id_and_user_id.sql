delete from exercise_tags
where exercise_id in (
  select id
  from exercises
  where id = $1 and user_id = $2
);
