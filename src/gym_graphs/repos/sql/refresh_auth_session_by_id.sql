update auth_sessions set last_active_at = now() where id = $1;
