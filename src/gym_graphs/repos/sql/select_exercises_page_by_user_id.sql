select exercises.id, exercises.name
from exercises
where exercises.user_id = $1
  and ($2 = 0 or exercises.id < $2)
  and (
    cardinality($3::integer[]) = 0
    or exists (
      select 1
      from exercise_tags
      where exercise_tags.exercise_id = exercises.id
        and exercise_tags.tag_id = any($3::integer[])
    )
  )
order by exercises.id desc
limit $4;
