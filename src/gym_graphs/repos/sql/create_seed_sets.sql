with source(exercise_name, weight_in_mg, repetitions, days_ago) as (
    select *
    from unnest($2::text[], $3::integer[], $4::integer[], $5::integer[])
)
insert into sets (exercise_id, weight_in_g, repetitions, done_at)
select
    exercises.id,
    source.weight_in_mg / 1000,
    source.repetitions,
    localtimestamp - make_interval(days => source.days_ago)
from source
inner join exercises
    on exercises.user_id = $1
    and exercises.name = source.exercise_name;
