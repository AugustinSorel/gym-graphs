-- +goose Up
create table auth_sessions (
    id integer generated always as identity primary key not null,
    user_id integer references users(id) on delete cascade not null,
    secret_hash bytea not null,
    last_active_at timestamptz default now() not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create trigger update_auth_sessions_modtime
before update on auth_sessions
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists auth_sessions;
