-- +goose Up
create table users (
    id integer generated always as identity primary key not null,
    email_address text not null unique,
    password_hash bytea not null,
    password_salt bytea not null,
    created_at timestamp default now() not null
);

-- +goose Down
drop table if exists users;
