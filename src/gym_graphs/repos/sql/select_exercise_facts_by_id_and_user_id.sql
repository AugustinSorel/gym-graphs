select
  count(sets.id)::int as total_sets,
  count(distinct date_trunc('day', sets.done_at))::int as total_sessions,
  coalesce(avg(sets.repetitions), 0)::float8 as average_repetitions,
  coalesce((
    select best_set.weight_in_g
    from sets as best_set
    where best_set.exercise_id = exercises.id
      and best_set.weight_in_g > 0
      and best_set.repetitions > 0
    order by
      best_set.weight_in_g::bigint * best_set.repetitions::bigint desc,
      best_set.done_at desc,
      best_set.id desc
    limit 1
  ), 0)::int as best_set_weight_in_g,
  coalesce((
    select best_set.repetitions
    from sets as best_set
    where best_set.exercise_id = exercises.id
      and best_set.weight_in_g > 0
      and best_set.repetitions > 0
    order by
      best_set.weight_in_g::bigint * best_set.repetitions::bigint desc,
      best_set.done_at desc,
      best_set.id desc
    limit 1
  ), 0)::int as best_set_repetitions
from exercises
left join sets on sets.exercise_id = exercises.id
where exercises.id = $1 and exercises.user_id = $2
group by exercises.id;
