import app/crypto
import app/ctx.{type Ctx}
import app/password_reset_session/sql.{type SelectPasswordResetSessionByIdRow} as password_reset_session_sql
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
  next: fn(SelectPasswordResetSessionByIdRow) -> Response,
) -> Response {
  let redirect =
    wisp.redirect("/reset-password")
    |> clear_cookie(req)

  let result =
    parse_cookie(req)
    |> result.try(decode_token)
    |> result.replace_error(redirect)
    |> result.try(fn(token) {
      verify_token(token, ctx)
      |> result.replace_error(redirect)
    })

  case result {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}

const cookie_name = "password_reset_session_token"

pub fn set_cookie(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
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

type PasswordResetSessionToken {
  PasswordResetSessionToken(id: Int, secret: BitArray)
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

  PasswordResetSessionToken(id:, secret:)
}

type VerifyPasswordResetSessionTokenError {
  InvalidToken
  ExpiredOrNotFound
}

fn verify_token(token: PasswordResetSessionToken, ctx: Ctx) {
  use session <- result.try(
    password_reset_session_sql.select_password_reset_session_by_id(
      ctx.db,
      token.id,
    )
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
