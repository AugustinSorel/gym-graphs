select repetitions, weight_in_g
from sets
where exercise_id = $1
order by created_at desc
limit 1
