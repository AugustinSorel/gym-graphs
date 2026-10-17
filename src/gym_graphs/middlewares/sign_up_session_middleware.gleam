import gleam/bool
import gleam/option
import gleam/result
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session.{type SignUpSession}
import gym_graphs/repos/sign_up_session_repo
import wisp.{type Request, type Response}

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SignUpSession) -> Response,
) -> Response {
  let result = {
    use token <- result.try({
      wisp.get_cookie(
        req,
        name: cookie.name(cookie.sign_up_session()),
        security: wisp.Signed,
      )
    })

    use #(id, secret) <- result.try(session.decode_token(token))

    use sign_up_session <- result.try(
      sign_up_session_repo.select_by_id(
        ctx.db,
        sign_up_session.SignUpSessionId(id),
      )
      |> result.replace_error(Nil)
      |> result.try(option.to_result(_, Nil))
      |> result.try(fn(session) {
        use <- bool.guard(
          when: sign_up_session.is_expired(session),
          return: Error(Nil),
        )

        Ok(session)
      }),
    )

    use Nil <- result.try(
      session.verify(sign_up_session.secret_hash, secret)
      |> result.replace_error(Nil),
    )

    Ok(sign_up_session)
  }

  case result {
    Ok(sign_up_session) -> next(sign_up_session)
    Error(Nil) -> {
      wisp.redirect("/sign-up")
      |> wisp.set_cookie(
        req,
        name: cookie.name(cookie.sign_up_session()),
        value: "",
        security: wisp.Signed,
        max_age: 0,
      )
    }
  }
}

pub fn require_unverified(
  req: Request,
  ctx: Ctx,
  next: fn(SignUpSession) -> Response,
) -> Response {
  use sign_up_session <- require(req, ctx)

  let already_verified =
    option.is_some(sign_up_session.email_address_verified_at)

  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/sign-up/set-password"),
  )

  next(sign_up_session)
}
// pub fn require_sign_up_verified(
//   req: Request,
//   ctx: Ctx,
//   next: fn(SignUpSession) -> Response,
// ) -> Response {
//   use sign_up_sess <- require_sign_up_session(req, ctx)

//   let not_verified = option.is_none(sign_up_sess.email_address_verified_at)

//   use <- bool.guard(
//     when: not_verified,
//     return: wisp.redirect("/sign-up/verify-email-address"),
//   )

//   next(sign_up_sess)
// }
