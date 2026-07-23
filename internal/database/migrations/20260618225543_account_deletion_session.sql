-- +goose Up
create table account_deletion_sessions (
    id integer generated always as identity primary key not null,
    auth_session_id integer references auth_sessions(id) on delete cascade not null,
    secret_hash bytea not null,
    user_identity_verified_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create trigger update_users_modtime
before update on account_deletion_sessions
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists account_deletion_sessions;
