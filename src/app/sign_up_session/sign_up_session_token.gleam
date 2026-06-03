import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sql
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/result
import gleam/string
import pog

pub type SignUpSessionToken {
  SignUpSessionToken(id: Int, secret: BitArray)
}

pub fn encode(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

pub fn decode(candidate_token: String) {
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

pub type VerifySignUpSessionTokenError {
  InvalidToken
  ExpiredOrNotFound
  DatabaseFailure(pog.QueryError)
}

pub fn verify(token: SignUpSessionToken, ctx: Ctx) {
  use session <- result.try(
    sql.select_sign_up_session_by_id(ctx.db, token.id)
    |> result.map_error(DatabaseFailure),
  )

  echo "1"

  use session <- result.try(case session {
    pog.Returned(_count, []) -> Error(ExpiredOrNotFound)
    pog.Returned(_count, [session, ..]) -> Ok(session)
  })

  echo "2"

  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(InvalidToken))

  echo "3"

  Ok(session)
}
