import identity/application/mailer.{type Mailer}
import identity/domain/repo.{type AuthSessionRepo}

type Repo {
  Repo(auth_session: AuthSessionRepo)
}

pub opaque type Ctx {
  Ctx(mailer: Mailer, repo: Repo)
}

pub fn new(mailer: Mailer, auth_session_repo: AuthSessionRepo) -> Ctx {
  let repo = Repo(auth_session: auth_session_repo)

  Ctx(mailer:, repo:)
}

pub fn mailer(ctx: Ctx) {
  ctx.mailer
}

pub fn auth_session_repo(ctx: Ctx) {
  ctx.repo.auth_session
}
