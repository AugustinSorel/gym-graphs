-- +goose Up
alter table users add column name text not null;

-- +goose Down
alter table users drop column name;
