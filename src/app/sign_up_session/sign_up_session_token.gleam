import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_repo
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/result
import gleam/string

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

pub type VerifySignUpSessionToken {
  InvalidToken
  TokenNotFound
  Database
}

pub fn verify(token: SignUpSessionToken, ctx: Ctx) {
  let session =
    sign_up_session_repo.select_by_id(ctx.db, token.id)
    |> result.map_error(fn(err) {
      case err {
        sign_up_session_repo.NotFound -> TokenNotFound
        sign_up_session_repo.Database -> Database
      }
    })

  use session <- result.try(session)

  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(InvalidToken))

  Ok(session)
}
