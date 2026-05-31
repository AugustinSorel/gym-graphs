-- +goose Up
create table auth_sessions (
    id integer generated always as identity primary key not null,
    user_id integer references users(id) on delete cascade not null,
    secret_hash bytea not null,
    created_at timestamp default now() not null
);

-- +goose Down
drop table if exists auth_sessions;
