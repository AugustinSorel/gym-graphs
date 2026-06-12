select users.email_address
from password_reset_sessions
inner join users on password_reset_sessions.user_id = users.id
where password_reset_sessions.id
=
$1;



