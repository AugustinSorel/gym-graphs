import app/auth_session/auth_session
import app/auth_session/sql
import app/ctx.{type Ctx}
import app/session
import app/user/sql as user_sql
import gleam/float
import gleam/result
import gleam/time/duration
import wisp.{type Request, type Response}

pub const cookie_name: String = "auth_session_token"

pub fn cookie_max_age() {
  duration.hours(24) |> duration.to_seconds() |> float.round()
}

pub fn require(req, ctx: Ctx, next) {
  let result = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    use session <- result.try(
      auth_session.select_by_id(ctx.db, token.id) |> result.replace_error(Nil),
    )

    use Nil <- result.try(session.validate_token(token, session.secret_hash))

    let auth_session = auth_session.AuthSession(id: session.id)

    let user =
      auth_session.User(
        id: session.user_id,
        name: session.name,
        email: session.email_address,
        created_at: session.user_created_at,
        weight_unit: case session.weight_unit {
          sql.Kg -> user_sql.Kg
          sql.Lbs -> user_sql.Lbs
        },
      )

    use Nil <- result.try(auth_session.refresh(session, ctx.db))

    Ok(#(auth_session, user, cookie))
  }

  case result {
    Ok(#(session, user, cookie)) ->
      next(session, user)
      |> session.set_cookie(req, cookie_name, cookie, cookie_max_age())
    Error(Nil) -> {
      wisp.redirect("/sign-up") |> session.clear_cookie(req, cookie_name)
    }
  }
}

pub fn require_blank(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let res = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    auth_session.select_by_id(ctx.db, token.id)
    |> result.replace_error(Nil)
    |> result.replace(Nil)
  }
  case res {
    Ok(Nil) -> wisp.redirect("/")
    Error(Nil) -> next()
  }
}
