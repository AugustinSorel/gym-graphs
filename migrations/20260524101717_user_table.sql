-- +goose Up
create type weight_unit as enum ('kg', 'lbs');

create table users (
    id integer generated always as identity primary key not null,
    email_address text not null unique,
    name text not null,
    weight_unit weight_unit not null default 'kg',
    password_hash bytea not null,
    password_salt bytea not null,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null
);

create trigger update_users_modtime
before update on users
for each row
execute function update_modified_column();

-- +goose Down
drop table if exists users;

drop type weight_unit;
