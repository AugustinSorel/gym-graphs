import app/auth_session/sql
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/session
import app/user/sql as user_sql
import gleam/float
import gleam/order
import gleam/result
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}
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
      select_by_id(ctx.db, token.id) |> result.replace_error(Nil),
    )

    use Nil <- result.try(session.validate_token(token, session.secret_hash))

    let auth_session = AuthSession(id: session.id)

    let user =
      User(
        id: session.user_id,
        name: session.name,
        email: session.email_address,
        created_at: session.user_created_at,
        weight_unit: case session.weight_unit {
          sql.Kg -> user_sql.Kg
          sql.Lbs -> user_sql.Lbs
        },
      )

    use Nil <- result.try(refresh(session, ctx.db))

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

    select_by_id(ctx.db, token.id)
    |> result.replace_error(Nil)
    |> result.replace(Nil)
  }
  case res {
    Ok(Nil) -> wisp.redirect("/")
    Error(Nil) -> next()
  }
}

pub type AuthSession {
  AuthSession(id: Int)
}

pub type User {
  User(
    id: Int,
    name: String,
    email: String,
    created_at: timestamp.Timestamp,
    weight_unit: user_sql.WeightUnit,
  )
}

pub fn create(db: pog.Connection, user_id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  sql.create(db, user_id, secret_hash)
  |> db.extract_first_row
  |> result.try(fn(session) { Ok(#(session, secret)) })
}

pub fn select_by_id(db: Connection, id: Int) {
  sql.select_by_id(db, id)
  |> db.extract_first_row
}

pub fn refresh(session: sql.SelectByIdRow, db: Connection) {
  let elapsed_vs_threshold =
    timestamp.system_time()
    |> timestamp.difference(session.last_active_at)
    |> duration.compare(duration.hours(12))

  case elapsed_vs_threshold {
    order.Gt -> {
      sql.refresh_last_active_at_by_id(db, session.id)
      |> result.replace(Nil)
      |> result.replace_error(Nil)
    }
    order.Lt | order.Eq -> Ok(Nil)
  }
}

pub fn delete_by_id(db: Connection, id: Int) {
  sql.delete_by_id(db, id) |> db.extract_first_row
}
