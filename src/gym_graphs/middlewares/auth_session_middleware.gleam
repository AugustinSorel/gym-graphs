import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/auth_session
import gym_graphs/domains/session
import gym_graphs/repos/auth_session_repo
import wisp.{type Request, type Response}

pub fn require_blank(req: Request, ctx: Ctx, next: fn() -> Response) {
  let res = {
    use token <- result.try({
      wisp.get_cookie(
        req,
        name: cookie.sign_up_session().name,
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
