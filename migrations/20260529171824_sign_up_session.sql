-- +goose Up
create table sign_up_sessions (
    id integer generated always as identity primary key not null,
    secret_hash bytea not null,
    email_address text not null,
    email_address_verification_code text not null,
    email_address_verified_at timestamp,
    created_at timestamp default now() not null
);

-- +goose Down
drop table if exists sign_up_sessions;
