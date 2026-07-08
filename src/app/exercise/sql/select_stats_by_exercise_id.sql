select
  s_best.weight_in_g as best_1rm_weight_in_g,
  s_best.repetitions as best_1rm_reps,
  agg.max_weight_in_g,
  agg.total_volume_in_g,
  agg.total_sets
from exercises e
left join lateral (
  select weight_in_g, repetitions
  from sets
  where exercise_id = e.id
  order by (weight_in_g::float * (1.0 + repetitions::float / 30.0)) desc
  limit 1
) s_best on true
left join lateral (
  select
    max(weight_in_g) as max_weight_in_g,
    sum(weight_in_g * repetitions)::bigint as total_volume_in_g,
    count(*)::int as total_sets
  from sets
  where exercise_id = e.id
) agg on true
where e.id = $1
  and e.user_id = $2
