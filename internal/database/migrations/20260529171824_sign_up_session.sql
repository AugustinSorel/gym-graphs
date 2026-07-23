-- +goose Up
create table sign_up_sessions (
    id integer generated always as identity primary key not null,
    secret_hash bytea not null,
    email_address text not null,
    email_address_verification_code text not null,
    email_address_verified_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create trigger update_users_modtime
before update on sign_up_sessions
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists sign_up_sessions;
