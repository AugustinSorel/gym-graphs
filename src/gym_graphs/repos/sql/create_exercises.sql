insert into exercises (user_id, name)
select $1, name
from unnest($2::text[]) as source(name);
