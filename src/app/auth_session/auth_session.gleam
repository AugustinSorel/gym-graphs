import app/auth_session/sql.{type SelectAuthSessionByIdRow} as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/order
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import pog.{type Connection}
import wisp.{type Request, type Response}

pub fn require(req: Request, ctx: Ctx, next) -> Response {
  let redirect = wisp.redirect("/sign-up") |> clear_cookie(req)

  let res = {
    use raw_token <- result.try(
      parse_cookie(req) |> result.replace_error(redirect),
    )

    use token <- result.try(
      decode_token(raw_token)
      |> result.replace_error(redirect),
    )

    use session <- result.try(
      verify_token(token, ctx)
      |> result.replace_error(redirect),
    )

    let response = next(session)

    refresh_auth_session(session, ctx.db)
    |> result.replace(response |> set_cookie(req, raw_token))
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
    parse_cookie(req)
    |> result.try(decode_token)
    |> result.try(fn(token) {
      verify_token(token, ctx)
      |> result.map_error(fn(_) { Nil })
    })

  case res {
    Ok(_session) -> wisp.redirect("/")
    Error(_) -> next()
  }
}

const cookie_name = "auth_session_token"

pub fn set_cookie(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}

pub fn clear_cookie(res: Response, req: Request) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}

fn parse_cookie(req: Request) {
  wisp.get_cookie(req, name: cookie_name, security: wisp.Signed)
}

type AuthSessionToken {
  AuthSessionToken(id: Int, secret: BitArray)
}

pub fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

fn decode_token(candidate_token: String) {
  let candidate_token = case string.split(candidate_token, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(Nil)
  }

  use #(raw_id, raw_secret) <- result.try(candidate_token)

  let candidate_id = raw_id |> int.parse()

  use id <- result.try(candidate_id)

  let candidate_secret = raw_secret |> bit_array.base64_decode()

  use secret <- result.map(candidate_secret)

  AuthSessionToken(id:, secret:)
}

type VerifyAuthSessionTokenError {
  InvalidToken
  ExpiredOrNotFound
}

fn verify_token(token: AuthSessionToken, ctx: Ctx) {
  use session <- result.try(
    auth_session_sql.select_auth_session_by_id(ctx.db, token.id)
    |> result.replace_error(InvalidToken),
  )

  use session <- result.try(case session {
    pog.Returned(_count, []) -> Error(ExpiredOrNotFound)
    pog.Returned(_count, [session, ..]) -> Ok(session)
  })

  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(InvalidToken))

  Ok(session)
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
