-- +goose Up
create type weight_unit as enum ('kg', 'lbs');
alter table users add column weight_unit weight_unit not null default 'kg';

-- +goose Down
alter table users drop column weight_unit;
drop type weight_unit;
