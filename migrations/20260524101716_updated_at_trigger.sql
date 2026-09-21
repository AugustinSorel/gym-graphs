-- +goose Up
-- +goose StatementBegin
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = NOW();
    return new;    
end;
$$ language plpgsql;
-- +goose StatementEnd

-- +goose Down
drop function if exists update_modified_column();
