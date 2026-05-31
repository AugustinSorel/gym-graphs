import app/crypto
import app/ctx.{type Ctx}
import app/verify_email_address/repo
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/result
import gleam/string
import wisp.{type Request}

pub type Error {
  MalformedToken
  InvalidToken
  TokenNotFound
  Database
}

pub fn parse_sign_up_session_token(
  req: Request,
) -> Result(#(Int, BitArray), Error) {
  let candidate_token =
    wisp.get_cookie(req, "sign_up_session_token", wisp.Signed)
    |> result.replace_error(MalformedToken)

  use candidate_token <- result.try(candidate_token)

  let candidate_token = case string.split(candidate_token, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(MalformedToken)
  }

  use #(raw_id, raw_secret) <- result.try(candidate_token)

  let candidate_id =
    raw_id
    |> int.parse()
    |> result.replace_error(MalformedToken)

  use candidate_id <- result.try(candidate_id)

  let candidate_secret =
    raw_secret
    |> bit_array.base64_decode()
    |> result.replace_error(MalformedToken)

  use candidate_secret <- result.map(candidate_secret)

  #(candidate_id, candidate_secret)
}

//TODO: find a better name
pub fn against_invalid(req: Request, ctx: Ctx) {
  let candidate_token = parse_sign_up_session_token(req)

  use candidate_token <- result.try(candidate_token)

  let #(candidate_session_id, candidate_session_secret) = candidate_token

  //TODO: change name
  let session = repo.select_by_id(ctx.db, candidate_session_id)

  let session = case session {
    Ok(session) -> Ok(session)
    Error(repo.NotFound) -> Error(TokenNotFound)
    Error(repo.Database) -> Error(Database)
  }

  use session <- result.try(session)

  let is_secret_valid =
    candidate_session_secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(InvalidToken))

  Ok(session)
}
