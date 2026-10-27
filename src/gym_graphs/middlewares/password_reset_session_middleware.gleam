import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/password_reset_session
import gym_graphs/domains/session
import gym_graphs/repos/password_reset_session_repo
import wisp.{type Request}

pub fn require(req: Request, ctx: Ctx, next) {
  let result = {
    use token <- result.try({
      wisp.get_cookie(req, cookie.password_reset().name, wisp.Signed)
    })

    use #(id, secret) <- result.try(session.decode_token(token))
    let id = password_reset_session.PasswordResetSessionId(id)

    use session <- result.try(
      password_reset_session_repo.select_by_id(ctx.db, id)
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil)),
    )

    use Nil <- result.try(
      session.verify(session.secret_hash, secret)
      |> result.replace_error(Nil),
    )

    Ok(session)
  }

  case result {
    Ok(session) -> next(session)
    Error(Nil) -> {
      wisp.redirect("/account")
      |> wisp.set_cookie(
        req,
        name: cookie.password_reset().name,
        value: "",
        security: wisp.Signed,
        max_age: 0,
      )
    }
  }
}

pub fn require_unverified(req: Request, ctx: Ctx, next) {
  use session <- require(req, ctx)

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/reset-password/set-new-password"),
  )

  next(session)
}

pub fn require_verified(req: Request, ctx: Ctx, next) {
  use session <- require(req, ctx)

  let not_verified = option.is_none(session.user_identity_verified_at)
  use <- bool.guard(
    when: not_verified,
    return: wisp.redirect("/reset-password/verify-email-code"),
  )

  next(session)
}
