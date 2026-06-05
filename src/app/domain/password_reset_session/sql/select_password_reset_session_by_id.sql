select * from password_reset_sessions where id = $1 and created_at > now() - interval '24 hours';

