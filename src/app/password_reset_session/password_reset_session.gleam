import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/email
import app/password_reset_session/sql.{type SelectPasswordResetSessionByIdRow} as password_reset_session_sql
import app/password_reset_session/template
import app/password_reset_session/ui as password_reset_ui
import app/user/sql as user_sql
import app/web
import aws/services/sesv2
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type QueryError}
import wisp.{type Request, type Response}

fn require(
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

type PasswordResetSessionToken {
  PasswordResetSessionToken(id: Int, secret: BitArray)
}

fn encode_token(id: Int, secret: BitArray) -> String {
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

type PasswordResetError {
  PasswordResetValidation(form: form.Form(password_reset_ui.ResetPasswordForm))
  PasswordResetDatabaseFailure(QueryError)
  PasswordResetUnexpectedDatabaseResult
  PasswordResetEmailSendFailure(sesv2.SendEmailError)
  UserNotFound
}

pub fn view_password_reset_page() -> Response {
  password_reset_ui.get_password_reset_form()
  |> password_reset_ui.password_reset_form()
  |> password_reset_ui.password_reset_page()
  |> web.html(200)
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(PasswordResetValidation),
    )

    use user <- result.try(select_user_by_email(ctx.db, input.email))

    use session <- result.try(create_reset_password_session(
      ctx.db,
      user.email_address,
    ))

    use _ <- result.try(
      email.send(
        email: ctx.email,
        to: user.email_address,
        subject: "Your password reset code",
        body: template.register_code(session.verification_code),
      )
      |> result.map_error(PasswordResetEmailSendFailure),
    )

    let token = encode_token(session.id, session.secret)

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> set_cookie(req, token)

    Error(PasswordResetValidation(form:)) ->
      form
      |> password_reset_ui.password_reset_form()
      |> web.html(422)

    Error(UserNotFound) ->
      password_reset_ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> password_reset_ui.password_reset_form()
      |> web.html(404)

    Error(PasswordResetDatabaseFailure(err)) -> {
      wisp.log_error(
        "password reset: database failure: " <> string.inspect(err),
      )
      password_reset_ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.password_reset_form()
      |> web.html(500)
    }

    Error(PasswordResetUnexpectedDatabaseResult) -> {
      wisp.log_error("password reset: unexpected database result")
      password_reset_ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.password_reset_form()
      |> web.html(500)
    }

    Error(PasswordResetEmailSendFailure(reason)) -> {
      wisp.log_error("password reset: " <> string.inspect(reason))
      password_reset_ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.password_reset_form()
      |> web.html(500)
    }
  }
}

type InternalResetPasswordSession {
  InternalResetPasswordSession(
    id: Int,
    secret: BitArray,
    verification_code: String,
  )
}

fn create_reset_password_session(
  db: pog.Connection,
  email_address: String,
) -> Result(InternalResetPasswordSession, PasswordResetError) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  let email_code = crypto.generate_password_reset_email_code()
  let email_code_salt = crypto.generate_hashing_salt()
  let email_code_hash =
    crypto.hash_password_reset_email_code(email_code, email_code_salt)

  password_reset_session_sql.create_password_reset_session(
    db,
    secret_hash,
    email_code_hash.raw_hash,
    email_code_salt,
    email_address,
  )
  |> result.map_error(PasswordResetDatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_count, []) -> Error(PasswordResetUnexpectedDatabaseResult)
      pog.Returned(_count, [session, ..]) ->
        Ok(InternalResetPasswordSession(session.id, secret, email_code))
    }
  })
}

fn select_user_by_email(
  db: pog.Connection,
  email: String,
) -> Result(user_sql.SelectUserByEmailAddressRow, PasswordResetError) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(PasswordResetDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_count, []) -> Error(UserNotFound)
      pog.Returned(_count, [user, ..]) -> Ok(user)
    }
  })
}

type VerifySharedError {
  AlreadyVerified
  VerifyUserNotFound
}

type VerifyEmailCodeInternalError {
  VerifyDatabaseFailure(QueryError)
}

pub fn view_verify_page(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    use user <- result.try(select_user_for_session(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      password_reset_ui.get_verify_form()
      |> password_reset_ui.verify_form(user.email_address)
      |> password_reset_ui.verify_page()
      |> web.html(200)

    Error(AlreadyVerified) -> wisp.redirect("/reset-password/set-new-password")

    Error(_) ->
      password_reset_ui.get_verify_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.verify_form("")
      |> password_reset_ui.verify_page()
      |> web.html(500)
  }
}

type VerifyError {
  VerifyValidation(form: form.Form(password_reset_ui.VerifyEmailCodeForm))
  VerifyShared(VerifySharedError)
  VerifyInternal(VerifyEmailCodeInternalError)
  IncorrectCode
}

pub fn verify(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyValidation),
    )

    let is_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(
      when: is_verified,
      return: Error(VerifyShared(AlreadyVerified)),
    )

    let email_code_hash =
      crypto.hash_password_reset_email_code(input.code, session.email_code_salt)

    let code_correct =
      crypto.validate_session_secret(
        session.email_code_hash,
        email_code_hash.raw_hash,
      )

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    mark_verified(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifyShared(AlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifyValidation(form:)) ->
      form
      |> password_reset_ui.verify_form("")
      |> web.html(422)

    Error(IncorrectCode) ->
      password_reset_ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> password_reset_ui.verify_form("")
      |> web.html(422)

    Error(VerifyShared(VerifyUserNotFound)) | Error(VerifyInternal(_)) -> {
      wisp.log_error(
        "password reset: verify error [session_id="
        <> string.inspect(session.id)
        <> "]",
      )
      password_reset_ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.verify_form("")
      |> web.html(500)
    }
  }
}

type CancelError {
  CancelInternalError(VerifyEmailCodeInternalError)
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result =
    password_reset_session_sql.delete_password_reset_session_by_id(
      ctx.db,
      session.id,
    )
    |> result.map_error(fn(err) {
      CancelInternalError(VerifyDatabaseFailure(err))
    })
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(CancelInternalError(_)) -> {
      password_reset_ui.get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.verify_form("")
      |> web.html(500)
    }
  }
}

fn mark_verified(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, VerifyError) {
  password_reset_session_sql.set_password_reset_session_to_verified_by_id(
    db,
    session_id,
  )
  |> result.map_error(fn(err) { VerifyInternal(VerifyDatabaseFailure(err)) })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(VerifyShared(AlreadyVerified))
    }
  })
}

fn select_user_for_session(
  db: pog.Connection,
  session_id: Int,
) -> Result(
  password_reset_session_sql.SelectUserByPasswordResetSessionIdRow,
  VerifySharedError,
) {
  password_reset_session_sql.select_user_by_password_reset_session_id(
    db,
    session_id,
  )
  |> result.map_error(fn(_) { VerifyUserNotFound })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(VerifyUserNotFound)
    }
  })
}

type SetNewPasswordShared {
  NotVerified
  SetNewPasswordUserNotFound
}

type SetNewPasswordError {
  SetNewPasswordValidation(
    form: form.Form(password_reset_ui.SetNewPasswordForm),
  )
  SetNewPasswordSharedError(SetNewPasswordShared)
  SetNewPasswordDatabaseFailure(QueryError)
  SetNewPasswordUnexpectedDatabaseResult
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    use user <- result.try(select_user_for_set_password(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      password_reset_ui.get_set_new_password_form()
      |> form.add_string("email_address", user.email_address)
      |> password_reset_ui.set_new_password_form()
      |> password_reset_ui.set_new_password_page()
      |> web.html(200)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(_) ->
      password_reset_ui.get_set_new_password_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.set_new_password_form()
      |> password_reset_ui.set_new_password_page()
      |> web.html(500)
  }
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetNewPasswordValidation),
    )

    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(
      when: not_verified,
      return: Error(SetNewPasswordSharedError(NotVerified)),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use new_auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try(update_password(tx, password_hash, salt, session.id))

        use _ <- result.try(delete_reset_session(tx, session.id))

        use new_auth_session <- result.try(create_auth_session(
          tx,
          session.user_id,
          secret_hash,
        ))

        Ok(new_auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> SetNewPasswordDatabaseFailure(err)
        }
      }),
    )

    Ok(#(new_auth_session, secret))
  }

  case result {
    Ok(#(new_auth_session, secret)) -> {
      let token = auth_session.encode_token(new_auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(SetNewPasswordValidation(form:)) ->
      form
      |> password_reset_ui.set_new_password_form()
      |> web.html(422)

    Error(SetNewPasswordSharedError(NotVerified)) ->
      wisp.redirect("/reset-password/verify-email-code")

    Error(error) -> {
      wisp.log_error(
        "password reset: set new password error [session_id="
        <> string.inspect(session.id)
        <> "]: "
        <> string.inspect(error),
      )
      password_reset_ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_ui.set_new_password_form()
      |> web.html(500)
    }
  }
}

fn update_password(
  db: pog.Connection,
  password_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_reset_session_sql.update_user_password_by_id(
    db,
    password_hash,
    salt,
    session_id,
  )
  |> result.map_error(SetNewPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(SetNewPasswordUnexpectedDatabaseResult)
    }
  })
}

fn delete_reset_session(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_reset_session_sql.delete_password_reset_session_by_id(db, session_id)
  |> result.map_error(SetNewPasswordDatabaseFailure)
  |> result.map(fn(_) { Nil })
}

fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) -> Result(auth_session_sql.CreateAuthSessionRow, SetNewPasswordError) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(SetNewPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(SetNewPasswordUnexpectedDatabaseResult)
    }
  })
}

fn select_user_for_set_password(
  db: pog.Connection,
  session_id: Int,
) -> Result(
  password_reset_session_sql.SelectUserByPasswordResetSessionIdRow,
  SetNewPasswordShared,
) {
  password_reset_session_sql.select_user_by_password_reset_session_id(
    db,
    session_id,
  )
  |> result.map_error(fn(_) { SetNewPasswordUserNotFound })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(SetNewPasswordUserNotFound)
    }
  })
}
