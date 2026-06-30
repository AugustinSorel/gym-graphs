delete from account_deletion_sessions where id = $1 returning *;
