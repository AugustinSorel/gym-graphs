import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session
import gym_graphs/domains/session
import gym_graphs/repos/auth_session_repo
import gym_graphs/repos/user_repo
import wisp.{type Request, type Response}

pub fn require(req, ctx: Ctx, next) {
  let result = {
    use token <- result.try({
      wisp.get_cookie(req, cookie.auth_session().name, wisp.Signed)
    })

    use #(id, secret) <- result.try(session.decode_token(token))
    let id = auth_session.AuthSessionId(id)

    use auth_session <- result.try(
      auth_session_repo.select_by_id(ctx.db, id)
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil)),
    )

    use Nil <- result.try(session.verify(auth_session.secret_hash, secret))

    use Nil <- result.try(
      auth_session_repo.refresh_by_id(ctx.db, auth_session.id)
      |> result.replace_error(Nil)
      |> result.replace(Nil),
    )

    use user <- result.try(
      user_repo.select_by_id(ctx.db, auth_session.user_id)
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil)),
    )

    Ok(#(user, token))
  }

  case result {
    Ok(#(user, token)) ->
      next(user)
      |> wisp.set_cookie(
        req,
        name: cookie.auth_session().name,
        value: token,
        security: wisp.Signed,
        max_age: cookie.auth_session().max_age,
      )
    Error(Nil) -> {
      wisp.redirect("/sign-up")
      |> wisp.set_cookie(req, cookie.auth_session().name, "", wisp.Signed, 0)
    }
  }
}

pub fn require_blank(req: Request, ctx: Ctx, next: fn() -> Response) {
  let res = {
    use token <- result.try({
      wisp.get_cookie(
        req,
        name: cookie.auth_session().name,
        security: wisp.Signed,
      )
    })

    use #(id, secret) <- result.try(session.decode_token(token))

    use auth_session <- result.try(
      auth_session_repo.select_by_id(ctx.db, auth_session.AuthSessionId(id))
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil)),
    )

    session.verify(auth_session.secret_hash, secret)
  }

  bool.guard(
    when: result.is_ok(res),
    return: wisp.redirect("/"),
    otherwise: next,
  )
}
