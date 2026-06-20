import app/account_deletion_session/sql.{
  type SelectAccountDeletionSessionByIdRow,
} as account_deletion_session_sql
import app/account_deletion_session/ui.{type VerifyPasswordForm} as account_deletion_ui
import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form.{type Form}
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import lustre/element/html
import pog.{type Connection, type QueryError}
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

type ViewVerifyPasswordPageError {
  SessionMissmatch
  ViewVerifyPasswordPageUserError(error: UserError)
  SessionAlreadyVerified
}

pub fn view_verify_password_page(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  let result = {
    let session_matched =
      auth_session.id == account_deletion_session.auth_session_id

    use <- bool.guard(when: !session_matched, return: Error(SessionMissmatch))

    let already_verified =
      option.is_some(account_deletion_session.user_identity_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(SessionAlreadyVerified),
    )

    use user <- result.try(
      select_user_by_id(ctx.db, auth_session.user_id)
      |> result.map_error(ViewVerifyPasswordPageUserError),
    )

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
    Error(ViewVerifyPasswordPageUserError(UserNotFound)) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root_err", form.CustomError("user not found"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(404)
    }
    Error(ViewVerifyPasswordPageUserError(UserDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root_err", form.CustomError("something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(404)
    }
  }
}

type UserError {
  UserNotFound
  UserDatabaseFailure(error: QueryError)
}

type VerifyPasswordError {
  VerifyPasswordSessionMissmatch
  VerifyPasswordSessionAlreadyVerified
  VerifyPasswordUserError(error: UserError)
  Validation(form: Form(VerifyPasswordForm))
  InvalidPassword
  SessionNotFound
  AccountDeletionSessionDatabaseFailure(error: QueryError)
}

pub fn verify_password(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let session_matched =
      auth_session.id == account_deletion_session.auth_session_id

    use <- bool.guard(
      when: !session_matched,
      return: Error(VerifyPasswordSessionMissmatch),
    )

    let session_verified =
      option.is_some(account_deletion_session.user_identity_verified_at)

    use <- bool.guard(
      when: session_verified,
      return: Error(VerifyPasswordSessionAlreadyVerified),
    )

    use user <- result.try({
      select_user_by_id(ctx.db, auth_session.user_id)
      |> result.map_error(VerifyPasswordUserError)
    })

    let is_password_correct =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(InvalidPassword),
    )

    use _ <- result.try({
      mark_session_as_verified(ctx.db, account_deletion_session.id)
    })

    Ok(Nil)
  }

  case result {
    Ok(_) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/confirm")
    }
    Error(VerifyPasswordSessionMissmatch) -> {
      wisp.redirect("/") |> clear_cookie(req)
    }
    Error(VerifyPasswordSessionAlreadyVerified) -> {
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/delete-account/confirm")
    }
    Error(VerifyPasswordUserError(UserNotFound)) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("User not found"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(404)
    }
    Error(VerifyPasswordUserError(UserDatabaseFailure(error:))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(500)
    }
    Error(Validation(form:)) -> {
      form
      |> account_deletion_ui.verify_password_form()
      |> web.html(422)
    }
    Error(InvalidPassword) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("password", form.CustomError("Incorect password."))
      |> account_deletion_ui.verify_password_form()
      |> web.html(422)
    }
    Error(SessionNotFound) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Session not found"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(404)
    }
    Error(AccountDeletionSessionDatabaseFailure(error:)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(500)
    }
  }
}

type ViewConfirmPageError {
  ConfirmSessionMissmatch
  ConfirmSessionNotVerified
}

pub fn view_confirm_page(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  let result = {
    let session_matched =
      auth_session.id == account_deletion_session.auth_session_id

    use <- bool.guard(
      when: !session_matched,
      return: Error(ConfirmSessionMissmatch),
    )

    let is_verified =
      option.is_some(account_deletion_session.user_identity_verified_at)

    use <- bool.guard(
      when: !is_verified,
      return: Error(ConfirmSessionNotVerified),
    )

    Ok(Nil)
  }

  case result {
    Ok(_) ->
      account_deletion_ui.get_account_deletion_form()
      |> account_deletion_ui.confirm_form()
      |> account_deletion_ui.confirm_page()
      |> web.html(200)

    Error(ConfirmSessionMissmatch) -> {
      wisp.redirect("/") |> clear_cookie(req)
    }
    Error(ConfirmSessionNotVerified) -> {
      wisp.redirect("/delete-account/verify-password")
    }
  }
}

type ConfirmError {
  ConfirmSessionMissmatchError
  ConfirmSessionNotVerifiedError
  ConfirmUserError(error: UserError)
}

pub fn confirm(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  let result =
    {
      let session_matched =
        auth_session.id == account_deletion_session.auth_session_id

      use <- bool.guard(
        when: !session_matched,
        return: Error(ConfirmSessionMissmatchError),
      )

      let is_verified =
        option.is_some(account_deletion_session.user_identity_verified_at)

      use <- bool.guard(
        when: !is_verified,
        return: Error(ConfirmSessionNotVerifiedError),
      )

      use _ <- result.try(
        delete_user(ctx.db, account_deletion_session.id)
        |> result.map_error(ConfirmUserError),
      )

      Ok(Nil)
    }
    |> echo

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-in")

    Error(ConfirmSessionMissmatchError) -> {
      wisp.redirect("/") |> clear_cookie(req)
    }

    Error(ConfirmSessionNotVerifiedError) ->
      wisp.redirect("/delete-account/verify-password")

    Error(ConfirmUserError(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_account_deletion_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> account_deletion_ui.confirm_form()
      |> web.html(500)
    }
  }
}

fn delete_user(db: Connection, id: Int) {
  user_sql.delete_user_by_account_deletion_session_id(db, id)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(rows) {
    echo rows
    case rows {
      pog.Returned(_count, [a, ..]) -> Ok(a)
      pog.Returned(_count, _rows) -> Error(UserNotFound)
    }
  })
}

pub type CancelAccountDeletionError {
  CancelSessionMissmatch
  CancelDatabaseFailure(errors: QueryError)
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use auth_session <- auth_session.require(req, ctx)

  use account_deletion_session <- require(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = {
    let session_matched =
      auth_session.id == account_deletion_session.auth_session_id

    use <- bool.guard(
      when: !session_matched,
      return: Error(CancelSessionMissmatch),
    )

    cancel_account_deletion(ctx.db, account_deletion_session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> auth_session.clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/")

    Error(CancelSessionMissmatch) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root_err", form.CustomError("session missmatched"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(403)
    }
    Error(CancelDatabaseFailure(errors:)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(errors))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root_err", form.CustomError("something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(403)
    }
  }
}

type InternalAccountDeletionSession {
  InternalAccountDeletionSession(id: Int, secret: BitArray)
}

fn create_account_deletion_session(db: Connection, auth_session_id: Int) {
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

fn select_user_by_id(db: Connection, id: Int) {
  user_sql.select_user_by_id(db, id)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Error(UserNotFound)
      pog.Returned(_, [user, ..]) -> Ok(user)
    }
  })
}

fn cancel_account_deletion(db: Connection, id: Int) {
  account_deletion_session_sql.delete_account_deletion_session_by_id(db, id)
  |> result.map_error(CancelDatabaseFailure)
  |> result.replace(Nil)
}

fn mark_session_as_verified(db: Connection, id: Int) {
  account_deletion_session_sql.set_identity_verified_to_now(db, id)
  |> result.map_error(AccountDeletionSessionDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(SessionNotFound)
    }
  })
}
