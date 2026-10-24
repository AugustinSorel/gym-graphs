import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/account_deletion_session
import gym_graphs/domains/session
import gym_graphs/middlewares/auth_session_middleware
import gym_graphs/repos/account_deletion_session_repo
import wisp.{type Request}

pub fn require(req: Request, ctx: Ctx, next) {
  let result = {
    use token <- result.try(wisp.get_cookie(
      req,
      cookie.account_deletion().name,
      wisp.Signed,
    ))
    use #(id, secret) <- result.try(session.decode_token(token))
    let id = account_deletion_session.AccountDeletionSessionId(id)

    use account_deletion_session <- result.try(
      account_deletion_session_repo.select_by_id(ctx.db, id)
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil))
      |> result.try(fn(account_deletion_session) {
        use <- bool.guard(
          when: account_deletion_session.is_expired(account_deletion_session),
          return: Error(Nil),
        )

        Ok(account_deletion_session)
      }),
    )
    use Nil <- result.try(
      session.verify(account_deletion_session.secret_hash, secret)
      |> result.replace_error(Nil),
    )

    Ok(account_deletion_session)
  }

  case result {
    Ok(account_deletion_session) -> next(account_deletion_session)
    Error(Nil) -> clear_cookie_and_redirect(req)
  }
}

pub fn require_unverified(req: Request, ctx: Ctx, next) {
  use auth_session, user <- auth_session_middleware.require(req, ctx)
  use account_deletion_session <- require(req, ctx)

  use <- bool.guard(
    when: auth_session.id != account_deletion_session.auth_session_id,
    return: clear_cookie_and_redirect(req),
  )
  use <- bool.guard(
    when: option.is_some(account_deletion_session.user_identity_verified_at),
    return: wisp.redirect("/delete-account/confirm"),
  )

  next(account_deletion_session, user)
}

pub fn require_verified(req: Request, ctx: Ctx, next) {
  use auth_session, user <- auth_session_middleware.require(req, ctx)
  use account_deletion_session <- require(req, ctx)

  use <- bool.guard(
    when: auth_session.id != account_deletion_session.auth_session_id,
    return: clear_cookie_and_redirect(req),
  )
  use <- bool.guard(
    when: option.is_none(account_deletion_session.user_identity_verified_at),
    return: wisp.redirect("/delete-account/verify-password"),
  )

  next(account_deletion_session, user)
}

fn clear_cookie_and_redirect(req: Request) {
  wisp.redirect("/account")
  |> wisp.set_cookie(
    req,
    name: cookie.account_deletion().name,
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}
