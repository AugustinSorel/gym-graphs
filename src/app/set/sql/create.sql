insert into sets (exercise_id, repetitions, weight_in_g)
values ($1, $2, $3)
returning id, exercise_id, repetitions, weight_in_g
