with source(source_id, name, created_at, updated_at) as (
    select *
    from unnest($2::integer[], $3::text[], $4::timestamp[], $5::timestamp[])
),
inserted as (
    insert into exercises (user_id, name, created_at, updated_at)
    select $1, name, created_at, updated_at
    from source
    returning id, name
)
select source.source_id, inserted.id
from source
inner join inserted on inserted.name = source.name;
