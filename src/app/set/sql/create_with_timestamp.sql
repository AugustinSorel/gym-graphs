insert into sets (exercise_id, repetitions, weight_in_g, created_at)
values ($1, $2, $3, $4)
returning id, exercise_id, repetitions, weight_in_g
