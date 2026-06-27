update users set weight_unit = $1 where id = $2 returning id, weight_unit;
