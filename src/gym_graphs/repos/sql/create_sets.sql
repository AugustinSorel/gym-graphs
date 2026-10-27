insert into sets (exercise_id, repetitions, weight_in_g)
select $1, source.repetitions, source.weight_in_g
from unnest($2::integer[], $3::integer[]) as source(repetitions, weight_in_g);
