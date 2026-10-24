-- +goose Up
create table exercise_tags (
    exercise_id integer references exercises(id) on delete cascade not null,
    tag_id integer references tags(id) on delete cascade not null,
    created_at timestamp default now() not null,
    primary key (exercise_id, tag_id)
);

-- +goose Down
drop table if exists exercise_tags;
