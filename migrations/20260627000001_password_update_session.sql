-- +goose Up
create table password_update_sessions (
    id integer generated always as identity primary key not null,
    auth_session_id integer references auth_sessions(id) on delete cascade not null,
    secret_hash bytea not null,
    user_identity_verified_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create trigger update_password_update_sessions_modtime
before update on password_update_sessions
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists password_update_sessions;
