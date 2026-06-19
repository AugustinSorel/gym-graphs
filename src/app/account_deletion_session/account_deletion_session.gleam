import app/account_deletion_session/sql.{
  type SelectAccountDeletionSessionByIdRow,
} as account_deletion_session_sql
import app/account_deletion_session/ui as account_deletion_ui
import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import lustre/element/html
import pog.{type QueryError}
import wisp.{type Request, type Response}

const cookie_name = "account_deletion_session_token"

fn set_cookie(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}

fn clear_cookie(res: Response, req: Request) -> Response {
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

type AccountDeletionSessionToken {
  AccountDeletionSessionToken(id: Int, secret: BitArray)
}

fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

fn decode_token(candidate_token: String) {
  use #(raw_id, raw_secret) <- result.try(
    case string.split(candidate_token, on: ".") {
      [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
      _ -> Error(Nil)
    },
  )

  use id <- result.try(int.parse(raw_id))
  use secret <- result.map(bit_array.base64_decode(raw_secret))
  AccountDeletionSessionToken(id:, secret:)
}

// ---------------------------------------------------------------------------
// Session guard
//
// TODO: once squirrel has generated sql.gleam, replace the Nil session type
//       with SelectAccountDeletionSessionByIdRow and add proper DB verification.
// ---------------------------------------------------------------------------

fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectAccountDeletionSessionByIdRow) -> Response,
) -> Response {
  let redirect =
    wisp.redirect("/")
    |> clear_cookie(req)

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

type VerifySignUpSessionTokenError {
  TokenInvalid
  TokenExpiredOrNotFound
}

fn verify_token(token: AccountDeletionSessionToken, ctx: Ctx) {
  use session <- result.try(
    account_deletion_session_sql.select_account_deletion_session_by_id(
      ctx.db,
      token.id,
    )
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

pub type StartError {
  StartDatabaseFailure(err: QueryError)
  UnexpectedDatabaseResult
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  let result = {
    use session <- result.try({
      create_account_deletion_session(ctx.db, auth_session.id)
    })

    Ok(encode_token(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> set_cookie(req, token)

    Error(StartDatabaseFailure(err:)) -> {
      wisp.log_error(req.path <> ": database failure: " <> string.inspect(err))
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
    Error(UnexpectedDatabaseResult) -> {
      wisp.log_error(req.path <> ": Unexpected database result")
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
  }
}

type VerifyPasswordPageError {
  SessionMissmatch
  SessionAlreadyVerified
  UserNotFound
  VerifyPasswordDatabaseFailure(error: QueryError)
}

pub fn view_verify_password_page(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  let result = {
    let same_session =
      auth_session.id == account_deletion_session.auth_session_id

    use <- bool.guard(when: !same_session, return: Error(SessionMissmatch))

    let already_verified =
      option.is_some(account_deletion_session.user_identity_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(SessionAlreadyVerified),
    )

    use user <- result.try(select_user_by_id(ctx.db, auth_session.user_id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      account_deletion_ui.get_verify_password_form()
      |> form.add_values([#("email", user.email_address)])
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(200)

    Error(SessionMissmatch) -> wisp.redirect("/") |> clear_cookie(req)
    Error(SessionAlreadyVerified) -> wisp.redirect("/delete-account/confirm")
    Error(UserNotFound) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root_err", form.CustomError("user not found"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(404)
    }
    Error(VerifyPasswordDatabaseFailure(error:)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root_err", form.CustomError("something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(404)
    }
  }
}

/// Step 2 (POST) – User confirms; delete the account.
pub fn confirm(req: Request, ctx: Ctx) -> Response {
  use _session <- require(req, ctx)

  // TODO: inside a pog.transaction:
  //   1. delete the user row (cascades to auth_sessions and deletion session)
  //   2. clear both auth and deletion cookies
  let _ = ctx

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/sign-up")
  |> clear_cookie(req)
}

/// Cancel – User backs out; delete the deletion session and go home.
pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use _session <- require(req, ctx)

  // TODO: account_deletion_session_sql.delete_account_deletion_session_by_id(ctx.db, session.id)
  let _ = ctx

  wisp.ok()
  |> clear_cookie(req)
  |> wisp.set_header("HX-Redirect", "/")
}

type InternalAccountDeletionSession {
  InternalAccountDeletionSession(id: Int, secret: BitArray)
}

fn create_account_deletion_session(db: pog.Connection, auth_session_id: Int) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  account_deletion_session_sql.create_account_deletion_session(
    db,
    auth_session_id,
    secret_hash,
  )
  |> result.map_error(StartDatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
    }
  })
  |> result.map(fn(session) {
    InternalAccountDeletionSession(id: session.id, secret:)
  })
}

fn select_user_by_id(db: pog.Connection, id: Int) {
  user_sql.select_user_by_id(db, id)
  |> result.map_error(VerifyPasswordDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Error(UserNotFound)
      pog.Returned(_, [user, ..]) -> Ok(user)
    }
  })
}
