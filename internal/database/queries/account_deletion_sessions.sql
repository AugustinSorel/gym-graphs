-- name: CreateAccountDeletionSession :one
insert into account_deletion_sessions (auth_session_id, secret_hash)
values ($1, $2)
returning *;

-- name: GetAccountDeletionSessionByID :one
select * from account_deletion_sessions where id = $1 and created_at > now() - interval '1 hour';

-- name: DeleteAccountDeletionSession :one
delete from account_deletion_sessions where id = $1 returning *;

-- name: MarkAccountDeletionSessionAsVerified :one
update account_deletion_sessions
set user_identity_verified_at = now()
where id = $1
  and user_identity_verified_at is null
returning *;
