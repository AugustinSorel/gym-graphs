import app/account_deletion/sql.{type SelectAccountDeletionSessionByIdRow} as account_deletion_session_sql
import app/account_deletion/ui.{type VerifyPasswordForm} as account_deletion_ui
import app/auth_session/auth_session.{type AuthSession}
import app/crypto
import app/ctx.{type Ctx}
import app/session_token
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/float
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

pub type UserLookupError {
  UserNotFound
  UserDatabaseFailure(QueryError)
}

pub type SessionLookupError {
  SessionRecordNotFound
  SessionDatabaseFailure(QueryError)
}

type VerifyTokenError {
  TokenInvalid
  TokenExpiredOrNotFound
}

fn verify_token(token: session_token.SessionToken, ctx: Ctx) {
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

fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectAccountDeletionSessionByIdRow) -> Response,
) -> Response {
  let invalid = wisp.redirect("/") |> clear_cookie(req)

  let result =
    parse_cookie(req)
    |> result.try(session_token.decode)
    |> result.replace_error(invalid)
    |> result.try(fn(token) {
      verify_token(token, ctx) |> result.replace_error(invalid)
    })

  case result {
    Ok(session) -> next(session)
    Error(response) -> response
  }
}

fn require_unverified_session(
  req: Request,
  ctx: Ctx,
  auth_session: AuthSession,
  next: fn(SelectAccountDeletionSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/") |> clear_cookie(req),
  )

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/delete-account/confirm"),
  )

  next(session)
}

fn require_verified_session(
  req: Request,
  ctx: Ctx,
  auth_session: AuthSession,
  next: fn(SelectAccountDeletionSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/") |> clear_cookie(req),
  )

  let is_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: !is_verified,
    return: wisp.redirect("/delete-account/verify-password"),
  )

  next(session)
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)

  let result =
    create_account_deletion_session(ctx.db, auth_session.id)
    |> result.map(fn(session) {
      session_token.encode(session.id, session.secret)
    })

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> set_cookie(req, token)

    Error(SessionDatabaseFailure(err)) -> {
      wisp.log_error(req.path <> ": database failure: " <> string.inspect(err))
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
    Error(SessionRecordNotFound) -> {
      wisp.log_error(req.path <> ": unexpected empty result creating session")
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
  }
}

type ViewVerifyPasswordPageError {
  ViewVerifyPasswordPageUserError(UserLookupError)
}

pub fn view_verify_password_page(req: Request, ctx: Ctx) -> Response {
  use auth_session, user <- auth_session.require(req, ctx)

  use _session <- require_unverified_session(req, ctx, auth_session)

  let result =
    select_user_by_id(ctx.db, user.id)
    |> result.map_error(ViewVerifyPasswordPageUserError)

  case result {
    Ok(user) ->
      account_deletion_ui.get_verify_password_form()
      |> form.add_values([#("email", user.email_address)])
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(200)

    Error(ViewVerifyPasswordPageUserError(UserNotFound)) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("user not found"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(404)
    }
    Error(ViewVerifyPasswordPageUserError(UserDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(500)
    }
  }
}

type VerifyPasswordError {
  VerifyPasswordFormError(Form(VerifyPasswordForm))
  VerifyPasswordUserError(UserLookupError)
  VerifyPasswordInvalidPassword
  VerifyPasswordSessionUpdateError(SessionLookupError)
}

pub fn verify_password(req: Request, ctx: Ctx) -> Response {
  use auth_session, user <- auth_session.require(req, ctx)
  use session <- require_unverified_session(req, ctx, auth_session)

  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(VerifyPasswordFormError),
    )

    use user <- result.try(
      select_user_by_id(ctx.db, user.id)
      |> result.map_error(VerifyPasswordUserError),
    )

    let is_password_correct =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(VerifyPasswordInvalidPassword),
    )

    use _ <- result.try(
      mark_session_as_verified(ctx.db, session.id)
      |> result.map_error(VerifyPasswordSessionUpdateError),
    )

    Ok(Nil)
  }

  case result {
    Ok(_) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/confirm")

    Error(VerifyPasswordFormError(form)) ->
      form
      |> account_deletion_ui.verify_password_form()
      |> web.html(422)

    Error(VerifyPasswordUserError(UserNotFound)) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("User not found"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(404)
    }
    Error(VerifyPasswordUserError(UserDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(500)
    }
    Error(VerifyPasswordInvalidPassword) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("password", form.CustomError("Incorrect password."))
      |> account_deletion_ui.verify_password_form()
      |> web.html(422)
    }
    Error(VerifyPasswordSessionUpdateError(SessionRecordNotFound)) -> {
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Session not found"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(404)
    }
    Error(VerifyPasswordSessionUpdateError(SessionDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> web.html(500)
    }
  }
}

pub fn view_confirm_page(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)

  use _session <- require_verified_session(req, ctx, auth_session)

  account_deletion_ui.get_account_deletion_form()
  |> account_deletion_ui.confirm_form()
  |> account_deletion_ui.confirm_page()
  |> web.html(200)
}

type ConfirmError {
  ConfirmUserError(UserLookupError)
}

pub fn confirm(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)
  use session <- require_verified_session(req, ctx, auth_session)

  let result =
    delete_user(ctx.db, session.id)
    |> result.map_error(ConfirmUserError)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> auth_session.clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-in")

    Error(ConfirmUserError(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_account_deletion_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> account_deletion_ui.confirm_form()
      |> web.html(500)
    }
  }
}

type CancelError {
  CancelDatabaseFailure(QueryError)
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)
  use session <- require(req, ctx)

  use form_data <- wisp.require_form(req)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/") |> clear_cookie(req),
  )

  let result =
    cancel_account_deletion(ctx.db, session.id)
    |> result.map_error(CancelDatabaseFailure)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/")

    Error(CancelDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> account_deletion_ui.verify_password_form()
      |> account_deletion_ui.verify_password_page()
      |> web.html(500)
    }
  }
}

type InternalAccountDeletionSession {
  InternalAccountDeletionSession(id: Int, secret: BitArray)
}

fn create_account_deletion_session(
  db: Connection,
  auth_session_id: Int,
) -> Result(InternalAccountDeletionSession, SessionLookupError) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  account_deletion_session_sql.create_account_deletion_session(
    db,
    auth_session_id,
    secret_hash,
  )
  |> result.map_error(SessionDatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(SessionRecordNotFound)
    }
  })
  |> result.map(fn(session) {
    InternalAccountDeletionSession(id: session.id, secret:)
  })
}

fn select_user_by_id(db: Connection, id: Int) -> Result(_, UserLookupError) {
  user_sql.select_user_by_id(db, id)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Error(UserNotFound)
      pog.Returned(_, [user, ..]) -> Ok(user)
    }
  })
}

fn cancel_account_deletion(db: Connection, id: Int) -> Result(Nil, QueryError) {
  account_deletion_session_sql.delete_account_deletion_session_by_id(db, id)
  |> result.replace(Nil)
}

fn mark_session_as_verified(
  db: Connection,
  id: Int,
) -> Result(Nil, SessionLookupError) {
  account_deletion_session_sql.set_identity_verified_to_now(db, id)
  |> result.map_error(SessionDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(SessionRecordNotFound)
    }
  })
}

fn delete_user(db: Connection, id: Int) -> Result(_, UserLookupError) {
  user_sql.delete_user_by_account_deletion_session_id(db, id)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(rows) {
    case rows {
      pog.Returned(_count, [a, ..]) -> Ok(a)
      pog.Returned(_count, _rows) -> Error(UserNotFound)
    }
  })
}
