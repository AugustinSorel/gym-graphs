import app/auth_session/auth_session.{type AuthSession}
import app/crypto
import app/ctx.{type Ctx}
import app/password_update/sql.{type SelectPasswordUpdateSessionByIdRow} as password_update_sql
import app/password_update/ui as password_update_ui
import app/session_token
import app/user/sql as user_sql
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type Connection, type QueryError}
import wisp.{type Request, type Response}

const cookie_name = "password_update_session_token"

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
    password_update_sql.select_password_update_session_by_id(ctx.db, token.id)
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
  next: fn(SelectPasswordUpdateSessionByIdRow) -> Response,
) -> Response {
  let invalid = wisp.redirect("/account") |> clear_cookie(req)

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
  next: fn(SelectPasswordUpdateSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> clear_cookie(req),
  )

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/update-password/set-new-password"),
  )

  next(session)
}

fn require_verified_session(
  req: Request,
  ctx: Ctx,
  auth_session: AuthSession,
  next: fn(SelectPasswordUpdateSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> clear_cookie(req),
  )

  let is_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: !is_verified,
    return: wisp.redirect("/update-password/verify-password"),
  )

  next(session)
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)

  let result =
    create_password_update_session(ctx.db, auth_session.id)
    |> result.map(fn(session) {
      session_token.encode(session.id, session.secret)
    })

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/verify-password")
      |> set_cookie(req, token)

    Error(SessionDatabaseFailure(err)) -> {
      wisp.log_error(req.path <> ": database failure: " <> string.inspect(err))
      wisp.internal_server_error()
    }

    Error(SessionRecordNotFound) -> {
      wisp.log_error(req.path <> ": unexpected empty result creating session")
      wisp.internal_server_error()
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
      password_update_ui.get_verify_password_form()
      |> form.add_values([#("email", user.email_address)])
      |> password_update_ui.verify_password_form()
      |> password_update_ui.verify_password_page()
      |> web.html(200)

    Error(ViewVerifyPasswordPageUserError(UserNotFound)) ->
      password_update_ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("user not found"))
      |> password_update_ui.verify_password_form()
      |> password_update_ui.verify_password_page()
      |> web.html(404)

    Error(ViewVerifyPasswordPageUserError(UserDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_update_ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> password_update_ui.verify_password_form()
      |> password_update_ui.verify_password_page()
      |> web.html(500)
    }
  }
}

type VerifyPasswordError {
  VerifyPasswordFormError(Form(password_update_ui.VerifyPasswordForm))
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
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(VerifyPasswordFormError),
    )

    use db_user <- result.try(
      select_user_by_id(ctx.db, user.id)
      |> result.map_error(VerifyPasswordUserError),
    )

    let is_password_correct =
      crypto.validate_user_password(db_user.password_hash, input.password)

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
      |> wisp.set_header("HX-Redirect", "/update-password/set-new-password")

    Error(VerifyPasswordFormError(invalid_form)) ->
      invalid_form
      |> password_update_ui.verify_password_form()
      |> web.html(422)

    Error(VerifyPasswordInvalidPassword) ->
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> password_update_ui.verify_password_form()
      |> web.html(422)

    Error(VerifyPasswordUserError(UserNotFound)) ->
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("User not found."))
      |> password_update_ui.verify_password_form()
      |> web.html(404)

    Error(VerifyPasswordUserError(UserDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_update_ui.verify_password_form()
      |> web.html(500)
    }

    Error(VerifyPasswordSessionUpdateError(SessionRecordNotFound)) ->
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Session not found."))
      |> password_update_ui.verify_password_form()
      |> web.html(404)

    Error(VerifyPasswordSessionUpdateError(SessionDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_update_ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_update_ui.verify_password_form()
      |> web.html(500)
    }
  }
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use auth_session, user <- auth_session.require(req, ctx)
  use _session <- require_verified_session(req, ctx, auth_session)

  password_update_ui.get_set_new_password_form()
  |> form.add_values([#("email", user.email)])
  |> password_update_ui.set_new_password_form()
  |> password_update_ui.set_new_password_page()
  |> web.html(200)
}

type SetNewPasswordError {
  SetNewPasswordFormError(Form(password_update_ui.SetNewPasswordForm))
  SetNewPasswordDatabaseFailure(QueryError)
  SetNewPasswordRecordNotFound
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- auth_session.require(req, ctx)
  use session <- require_verified_session(req, ctx, auth_session)

  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_update_ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(SetNewPasswordFormError),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)

    use _ <- result.try({
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try({
          update_user_password(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(
          delete_password_update_session_by_id(tx, session.id)
          |> result.map_error(SetNewPasswordDatabaseFailure),
        )

        Ok(Nil)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> SetNewPasswordDatabaseFailure(err)
        }
      })
    })

    Ok(Nil)
  }

  case result {
    Ok(_) ->
      wisp.created()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(SetNewPasswordFormError(invalid_form)) ->
      invalid_form
      |> password_update_ui.set_new_password_form()
      |> web.html(422)

    Error(SetNewPasswordRecordNotFound) -> {
      wisp.log_error(req.path <> ": no rows updated — session may be invalid")
      password_update_ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_update_ui.set_new_password_form()
      |> web.html(500)
    }

    Error(SetNewPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_update_ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_update_ui.set_new_password_form()
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

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> clear_cookie(req),
  )

  let result =
    delete_password_update_session_by_id(ctx.db, session.id)
    |> result.map_error(CancelDatabaseFailure)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(CancelDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/account")
    }
  }
}

type InternalPasswordUpdateSession {
  InternalPasswordUpdateSession(id: Int, secret: BitArray)
}

fn create_password_update_session(
  db: Connection,
  auth_session_id: Int,
) -> Result(InternalPasswordUpdateSession, SessionLookupError) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  password_update_sql.create_password_update_session(
    db,
    auth_session_id,
    secret_hash,
  )
  |> result.map_error(SessionDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(SessionRecordNotFound)
    }
  })
  |> result.map(fn(session) {
    InternalPasswordUpdateSession(id: session.id, secret:)
  })
}

fn select_user_by_id(db: Connection, id: Int) -> Result(_, UserLookupError) {
  user_sql.select_user_by_id(db, id)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, []) -> Error(UserNotFound)
      pog.Returned(_, [user, ..]) -> Ok(user)
    }
  })
}

fn mark_session_as_verified(
  db: Connection,
  id: Int,
) -> Result(Nil, SessionLookupError) {
  password_update_sql.set_identity_verified_to_now(db, id)
  |> result.map_error(SessionDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(SessionRecordNotFound)
    }
  })
}

fn update_user_password(
  db: Connection,
  password_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_update_sql.update_user_password_by_password_update_session_id(
    db,
    password_hash,
    salt,
    session_id,
  )
  |> result.map_error(SetNewPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(SetNewPasswordRecordNotFound)
    }
  })
}

fn delete_password_update_session_by_id(db: Connection, id: Int) {
  password_update_sql.delete_password_update_session_by_id(db, id)
  |> result.replace(Nil)
}
