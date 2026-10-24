with source(exercise_name, tag_name) as (
    select *
    from unnest($2::text[], $3::text[])
)
insert into exercise_tags (exercise_id, tag_id)
select exercises.id, tags.id
from source
inner join exercises
    on exercises.user_id = $1
    and exercises.name = source.exercise_name
inner join tags
    on tags.user_id = $1
    and tags.name = source.tag_name;
