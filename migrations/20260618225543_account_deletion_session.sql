-- +goose Up
create table account_deletion_sessions (
    id integer generated always as identity primary key not null,
    auth_session_id integer references auth_sessions(id) on delete cascade not null,
    secret_hash bytea not null,
    user_identity_verified_at timestamp,
    created_at timestamp default now() not null
);

-- +goose Down
drop table if exists account_deletion_sessions;
