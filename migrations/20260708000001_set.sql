-- +goose Up
create table sets(
    id integer generated always as identity primary key not null,
    exercise_id integer references exercises(id) on delete cascade not null,
    repetitions integer not null,
    weight_in_g integer not null,
    updated_at timestamp default now() not null,
    created_at timestamp default now() not null
);

create trigger update_sets_modtime
before update on sets
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists sets;
