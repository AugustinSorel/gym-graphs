import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/password_update_session
import gym_graphs/domains/session
import gym_graphs/middlewares/auth_session_middleware
import gym_graphs/repos/password_update_session_repo
import wisp.{type Request}

pub fn require(req: Request, ctx: Ctx, next) {
  let result = {
    use token <- result.try({
      wisp.get_cookie(req, cookie.password_update().name, wisp.Signed)
    })

    use #(id, secret) <- result.try(session.decode_token(token))
    let id = password_update_session.PasswordUpdateSessionId(id)

    use password_update_session <- result.try(
      password_update_session_repo.select_by_id(ctx.db, id)
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil))
      |> result.try(fn(session) {
        use <- bool.guard(
          when: password_update_session.is_expired(session),
          return: Error(Nil),
        )

        Ok(session)
      }),
    )

    use Nil <- result.try(
      session.verify(password_update_session.secret_hash, secret)
      |> result.replace_error(Nil),
    )

    Ok(password_update_session)
  }

  case result {
    Ok(password_update_session) -> next(password_update_session)
    Error(Nil) ->
      wisp.redirect("/account")
      |> wisp.set_cookie(
        req,
        name: cookie.password_update().name,
        value: "",
        security: wisp.Signed,
        max_age: 0,
      )
  }
}

pub fn require_unverified(req: Request, ctx: Ctx, next) {
  use auth_session, user <- auth_session_middleware.require(req, ctx)
  use password_update_session <- require(req, ctx)

  use <- bool.guard(
    when: auth_session.id != password_update_session.auth_session_id,
    return: wisp.redirect("/account")
      |> wisp.set_cookie(
        req,
        name: cookie.password_update().name,
        value: "",
        security: wisp.Signed,
        max_age: 0,
      ),
  )

  use <- bool.guard(
    when: option.is_some(password_update_session.user_identity_verified_at),
    return: wisp.redirect("/update-password/set-new-password"),
  )

  next(password_update_session, user)
}
