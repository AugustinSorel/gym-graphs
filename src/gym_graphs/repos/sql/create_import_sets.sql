insert into sets (
    exercise_id,
    repetitions,
    weight_in_g,
    done_at,
    created_at,
    updated_at
)
select *
from unnest(
    $1::integer[],
    $2::integer[],
    $3::integer[],
    $4::timestamp[],
    $5::timestamp[],
    $6::timestamp[]
);
