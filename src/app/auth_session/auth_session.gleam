import app/auth_session/auth_session_cookie
import app/auth_session/auth_session_token
import app/auth_session/sql.{type SelectAuthSessionByIdRow} as auth_session_sql
import app/ctx.{type Ctx}
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}
import wisp.{type Request, type Response}

pub fn require(req: Request, ctx: Ctx, next) -> Response {
  let redirect = wisp.redirect("/sign-up") |> auth_session_cookie.clear(req)

  let res = {
    use raw_token <- result.try(
      auth_session_cookie.parse(req)
      |> result.replace_error(redirect),
    )

    use token <- result.try(
      auth_session_token.decode(raw_token)
      |> result.replace_error(redirect),
    )

    use session <- result.try(
      auth_session_token.verify(token, ctx)
      |> result.replace_error(redirect),
    )

    let response = next(session)

    refresh_auth_session(session, ctx.db)
    |> result.replace(response |> auth_session_cookie.set(req, raw_token))
    |> result.replace_error(response)
  }

  case res {
    Ok(response) | Error(response) -> response
  }
}

pub fn require_blank(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let res =
    auth_session_cookie.parse(req)
    |> result.try(auth_session_token.decode)
    |> result.try(fn(token) {
      auth_session_token.verify(token, ctx)
      |> result.map_error(fn(_) { Nil })
    })

  case res {
    Ok(_session) -> wisp.redirect("/")
    Error(_) -> next()
  }
}

fn refresh_auth_session(session: SelectAuthSessionByIdRow, db: Connection) {
  let elapsed_vs_threshold =
    timestamp.system_time()
    |> timestamp.difference(session.last_active_at)
    |> duration.compare(duration.hours(12))

  case elapsed_vs_threshold {
    order.Gt -> {
      auth_session_sql.update_auth_session_last_active_at(db, session.id)
      |> result.replace(Nil)
      |> result.replace_error(Nil)
    }
    order.Lt | order.Eq -> Error(Nil)
  }
}
