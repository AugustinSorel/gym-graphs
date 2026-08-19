-- +goose Up
create type one_rep_max_algorithm as enum (
    'adams',
    'baechle',
    'berger',
    'brown',
    'brzycki',
    'epley',
    'kemmler',
    'landers',
    'lombardi',
    'mayhew',
    'naclerio',
    'oconner',
    'wathen'
);

alter table users
    add column one_rep_max_algorithm one_rep_max_algorithm not null default 'epley';

-- +goose Down
alter table users drop column one_rep_max_algorithm;
drop type one_rep_max_algorithm cascade;
