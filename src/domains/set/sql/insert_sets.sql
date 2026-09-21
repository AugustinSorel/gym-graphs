insert into sets (exercise_id, repetitions, weight_in_g, done_at)
select unnest($1::int[]), unnest($2::int[]), unnest($3::int[]), unnest($4::timestamp[]);
