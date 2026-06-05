-- +goose Up
create table password_reset_sessions (
    id integer generated always as identity primary key not null,
    user_id integer references users(id) on delete cascade not null,
    secret_hash bytea not null,
    email_code_hash bytea not null,
    email_code_salt bytea not null,
    user_identity_verified_at timestamp,
    created_at timestamp default now() not null
);

-- +goose Down
drop table if exists password_reset_sessions;
