select
    id,
    email_address,
    name,
    weight_unit,
    one_rep_max_algorithm,
    created_at,
    updated_at
from users
where id = $1;
