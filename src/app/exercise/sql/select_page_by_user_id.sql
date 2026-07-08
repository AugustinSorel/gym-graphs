select
  e.id,
  e.name,
  e.index,
  s1.repetitions as last_reps,
  s1.weight_in_g as last_weight_in_g,
  s2.repetitions as prev_reps,
  s2.weight_in_g as prev_weight_in_g,
  sc.sets_count,
  sc.last_set_at
from exercises e
left join lateral (
  select repetitions, weight_in_g
  from sets
  where exercise_id = e.id
  order by created_at desc
  limit 1
) s1 on true
left join lateral (
  select repetitions, weight_in_g
  from sets
  where exercise_id = e.id
  order by created_at desc
  limit 1 offset 1
) s2 on true
left join lateral (
  select count(*)::int as sets_count, max(created_at) as last_set_at
  from sets
  where exercise_id = e.id
) sc on true
where e.user_id = $1
  and ($2 = -1 or e.index < $2)
  and ($4 = '' or e.name ilike '%' || $4 || '%')
order by e.index desc
limit $3
