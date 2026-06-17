-- +goose Up
alter table auth_sessions add column last_active_at timestamp default now() not null;

-- +goose Down
alter table auth_sessions drop column last_active_at;
