import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sql.{type SelectSignUpSessionByIdRow} as sign_up_session_sql
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/result
import gleam/string
import gleam/time/duration
import pog
import wisp.{type Request, type Response}

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  let redirect = wisp.redirect("/sign-up") |> clear_cookie(req)

  let result =
    parse_cookie(req)
    |> result.try(decode_token)
    |> result.replace_error(redirect)
    |> result.try(fn(token) {
      verify_token(token, ctx) |> result.replace_error(redirect)
    })

  case result {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}

const cookie_name: String = "sign_up_session_token"

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
  wisp.get_cookie(req, cookie_name, wisp.Signed)
}

type SignUpSessionToken {
  SignUpSessionToken(id: Int, secret: BitArray)
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

  SignUpSessionToken(id:, secret:)
}

type VerifySignUpSessionTokenError {
  TokenInvalid
  TokenExpiredOrNotFound
}

fn verify_token(
  token: SignUpSessionToken,
  ctx: Ctx,
) -> Result(SelectSignUpSessionByIdRow, VerifySignUpSessionTokenError) {
  use session <- result.try(
    sign_up_session_sql.select_sign_up_session_by_id(ctx.db, token.id)
    |> result.replace_error(TokenInvalid),
  )

  use session <- result.try(case session {
    pog.Returned(_count, []) -> Error(TokenExpiredOrNotFound)
    pog.Returned(_count, [session, ..]) -> Ok(session)
  })

  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(TokenInvalid))

  Ok(session)
}
