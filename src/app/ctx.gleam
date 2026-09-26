import identity/application/mailer.{type Mailer}
import identity/domain/repo.{
  type AuthSessionRepo, type SignUpSessionRepo, type UserRepo,
}

pub opaque type Repo {
  Repo(
    auth_session: AuthSessionRepo,
    sign_up_session: SignUpSessionRepo,
    user: UserRepo,
  )
}

pub opaque type Ctx {
  Ctx(mailer: Mailer, repo: Repo)
}

pub fn new(mailer: Mailer, repo: Repo) -> Ctx {
  Ctx(mailer:, repo:)
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
