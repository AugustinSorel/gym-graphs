select
  exercises.id,
  exercises.name,
  set_summary.latest_set_repetitions,
  set_summary.latest_set_weight_in_g,
  set_summary.latest_set_done_at,
  set_summary.previous_set_repetitions,
  set_summary.previous_set_weight_in_g,
  set_summary.set_count
from exercises
left join lateral (
  select
    sets.repetitions as latest_set_repetitions,
    sets.weight_in_g as latest_set_weight_in_g,
    sets.done_at as latest_set_done_at,
    lead(sets.repetitions) over sets_by_recency as previous_set_repetitions,
    lead(sets.weight_in_g) over sets_by_recency as previous_set_weight_in_g,
    count(*) over ()::int as set_count
  from sets
  where sets.exercise_id = exercises.id
  window sets_by_recency as (order by sets.done_at desc, sets.id desc)
  order by sets.done_at desc, sets.id desc
  limit 1
) as set_summary on true
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
