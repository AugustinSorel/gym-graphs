-- +goose Up
create table tags (
    id integer generated always as identity primary key not null,
    user_id integer references users(id) on delete cascade not null,
    name text not null,
    updated_at timestamptz default now() not null,
    created_at timestamptz default now() not null,
    unique (user_id, name)
);

create trigger update_tags_modtime
before update on tags
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists tags;
