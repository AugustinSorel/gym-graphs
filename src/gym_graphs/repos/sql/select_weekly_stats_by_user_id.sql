select
    coalesce(sum(s.weight_in_g::numeric * s.repetitions::numeric), 0)::text as total_volume_in_g,
    count(s.id)::int as total_sets,
    coalesce(sum(s.weight_in_g::numeric), 0)::text as total_weight_in_g,
    count(distinct s.exercise_id)::int as exercises_count
from sets s
inner join exercises e on e.id = s.exercise_id
where e.user_id = $1
  -- done_at is stored in the database's local time, so its week boundary must be too.
  and s.done_at >= date_trunc('week', localtimestamp)
  and s.done_at < date_trunc('week', localtimestamp) + interval '1 week';
