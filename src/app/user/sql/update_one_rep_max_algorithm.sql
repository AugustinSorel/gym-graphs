update users set one_rep_max_algorithm = $1 where id = $2 returning id, one_rep_max_algorithm;
