import identity/domain/event_publisher.{type EventPublisher}
import identity/domain/repo.{
  type AuthSessionRepo, type SignUpSessionRepo, type UserRepo,
}
import kernel/mailer.{type Mailer}
import pog.{type Connection, type TransactionError}

pub opaque type Repo {
  Repo(
    auth_session: AuthSessionRepo,
    sign_up_session: SignUpSessionRepo,
    user: UserRepo,
  )
}

pub opaque type Ctx {
  Ctx(
    db: Connection,
    mailer: Mailer,
    repo: Repo,
    event_publisher: EventPublisher,
  )
}

pub fn new(
  db: Connection,
  mailer: Mailer,
  repo: Repo,
  event_publisher: EventPublisher,
) -> Ctx {
  Ctx(db:, mailer:, repo:, event_publisher:)
}

pub fn transaction(
  ctx: Ctx,
  callback: fn(Connection) -> Result(a, e),
) -> Result(a, TransactionError(e)) {
  pog.transaction(ctx.db, callback)
}

pub fn new_repo(
  auth_session: AuthSessionRepo,
  sign_up_session: SignUpSessionRepo,
  user: UserRepo,
) {
  Repo(auth_session:, sign_up_session:, user:)
}

pub fn mailer(ctx: Ctx) {
  ctx.mailer
}

pub fn auth_session_repo(ctx: Ctx) {
  ctx.repo.auth_session
}

pub fn user_repo(ctx: Ctx) {
  ctx.repo.user
}

pub fn sign_up_session_repo(ctx: Ctx) {
  ctx.repo.sign_up_session
}

pub fn event_publisher(ctx: Ctx) {
  ctx.event_publisher
}
