-- name: CreateExercise :one
insert into exercises (user_id, name)
values ($1, $2)
returning *;

-- name: CreateExerciseTags :exec
insert into exercise_tags (exercise_id, tag_id)
select $1, unnest($2::int[]);

-- name: GetExercisesPageByUserID :many
SELECT
    e.id, 
    e.user_id, 
    e.name, 
    e.index, 
    e.updated_at, 
    e.created_at,
    COALESCE(s.sets_count, 0) AS sets_count,
    s.last_set_weight_in_g,
    s.last_set_repetitions,
    s.prev_set_weight_in_g,
    s.prev_set_repetitions
FROM exercises e
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS sets_count,
        -- Extract the 1st row's data
        COALESCE(MAX(weight_in_g) FILTER (WHERE rn = 1), 0)::int AS last_set_weight_in_g,
        COALESCE(MAX(repetitions) FILTER (WHERE rn = 1), 0)::int AS last_set_repetitions,
        -- Extract the 2nd row's data
        COALESCE(MAX(weight_in_g) FILTER (WHERE rn = 2), 0)::int AS prev_set_weight_in_g,
        COALESCE(MAX(repetitions) FILTER (WHERE rn = 2), 0)::int AS prev_set_repetitions
    FROM (
        SELECT
            weight_in_g,
            repetitions,
            ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM sets
        WHERE exercise_id = e.id
    ) ranked_sets
) s ON true
WHERE e.user_id = $1
  AND e.index < $2
ORDER BY e.index DESC
LIMIT $3;

-- name: GetExercisesCountByUserID :one
select count(*) from exercises
where user_id = $1;

-- name: GetExerciseByIDAndUserID :one
select id, user_id, name, index, updated_at, created_at from exercises
where id = $1 and user_id = $2;
