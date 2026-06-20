delete from users
where id in (
    select auth_sessions.user_id
    from auth_sessions
    inner join account_deletion_sessions
        on auth_sessions.id = account_deletion_sessions.auth_session_id
    where account_deletion_sessions.id = $1
    and account_deletion_sessions.user_identity_verified_at is not null
)
returning *;
