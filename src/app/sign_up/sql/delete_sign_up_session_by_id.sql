delete from sign_up_sessions where id = $1 returning *;
