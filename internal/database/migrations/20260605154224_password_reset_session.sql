-- +goose Up
create table password_reset_sessions (
    id integer generated always as identity primary key not null,
    user_id integer references users(id) on delete cascade not null,
    secret_hash bytea not null,
    email_code_hash bytea not null,
    email_code_salt bytea not null,
    user_identity_verified_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create trigger update_users_modtime
before update on password_reset_sessions
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists password_reset_sessions;
