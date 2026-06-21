import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/email
import app/session_token
import app/sign_up/sql.{type SelectSignUpSessionByIdRow} as sign_up_session_sql
import app/sign_up/template
import app/sign_up/ui as sign_up_ui
import app/user/sql as user_sql
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type QueryError}
import wisp.{type Request, type Response}

const cookie_name: String = "sign_up_session_token"

fn set_cookie(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(24) |> duration.to_seconds() |> float.round(),
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
  wisp.get_cookie(req, cookie_name, wisp.Signed)
}

pub type SessionLookupError {
  SessionRecordNotFound
  SessionDatabaseFailure(QueryError)
}

pub type UserLookupError {
  UserNotFound
  UserDatabaseFailure(QueryError)
}

type VerifySignUpSessionTokenError {
  TokenInvalid
  TokenExpiredOrNotFound
}

fn verify_token(
  token: session_token.SessionToken,
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

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  let invalid = wisp.redirect("/sign-up") |> clear_cookie(req)

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

fn require_unverified_email_session(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let already_verified = option.is_some(session.email_address_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/sign-up/set-password"),
  )

  next(session)
}

fn require_verified_email_session(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  use session <- require(req, ctx)

  let not_verified = option.is_none(session.email_address_verified_at)
  use <- bool.guard(
    when: not_verified,
    return: wisp.redirect("/sign-up/verify-email-address"),
  )

  next(session)
}

pub fn view_register_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  sign_up_ui.get_register_form()
  |> sign_up_ui.register_form()
  |> sign_up_ui.register_page()
  |> web.html(200)
}

type RegisterError {
  RegisterFormError(Form(sign_up_ui.EmailRegisterForm))
  EmailAlreadyTaken
  RegisterSessionError(SessionLookupError)
  RegisterEmailSendFailure(email.SendEmailError)
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(RegisterFormError),
    )

    use _ <- result.try(
      ensure_email_available(ctx.db, input.email)
      |> result.map_error(fn(e) {
        case e {
          UserDatabaseFailure(err) ->
            RegisterSessionError(SessionDatabaseFailure(err))
          UserNotFound -> EmailAlreadyTaken
        }
      }),
    )

    use session <- result.try(
      create_sign_up_session(ctx.db, input.email)
      |> result.map_error(RegisterSessionError),
    )

    use _ <- result.try(
      email.send(
        email: ctx.email,
        to: input.email,
        subject: "Your verification code - " <> session.verification_code,
        html: template.verification_code(session.verification_code),
      )
      |> result.map_error(RegisterEmailSendFailure),
    )

    Ok(session_token.encode(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> set_cookie(req, token)

    Error(RegisterFormError(form)) ->
      form
      |> sign_up_ui.register_form()
      |> web.html(422)

    Error(EmailAlreadyTaken) ->
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> sign_up_ui.register_form()
      |> web.html(409)

    Error(RegisterSessionError(SessionDatabaseFailure(err))) -> {
      wisp.log_error("sign up: database failure: " <> string.inspect(err))
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }
    Error(RegisterSessionError(SessionRecordNotFound)) -> {
      wisp.log_error("sign up: unexpected database result")
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }
    Error(RegisterEmailSendFailure(reason)) -> {
      wisp.log_error("sign up: " <> string.inspect(reason))
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }
  }
}

pub fn view_verify_email_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require_unverified_email_session(req, ctx)

  sign_up_ui.get_verify_email_form()
  |> sign_up_ui.verify_email_form()
  |> sign_up_ui.verify_email_page(session.email_address, _)
  |> web.html(200)
}

type VerifyEmailError {
  VerifyEmailFormError(Form(sign_up_ui.VerifyEmailAddressForm))
  VerifyEmailInvalidCode
  VerifyEmailSessionUpdateError(SessionLookupError)
}

pub fn verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require_unverified_email_session(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailFormError),
    )

    verify_email_address(
      ctx.db,
      session.id,
      session.email_address_verification_code,
      input.code,
    )
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifyEmailFormError(form)) ->
      form
      |> sign_up_ui.verify_email_form()
      |> web.html(422)

    Error(VerifyEmailInvalidCode) ->
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> sign_up_ui.verify_email_form()
      |> web.html(422)

    Error(VerifyEmailSessionUpdateError(SessionDatabaseFailure(err))) -> {
      wisp.log_error("sign up: verify email error: " <> string.inspect(err))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
    Error(VerifyEmailSessionUpdateError(SessionRecordNotFound)) -> {
      wisp.log_error("sign up: verify email: session not found")
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
  }
}

type ResendEmailVerificationError {
  ResendEmailSendFailure(email.SendEmailError)
}

pub fn resend_verify_email_code(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require_unverified_email_session(req, ctx)

  use form_data <- wisp.require_form(req)

  let result =
    email.send(
      email: ctx.email,
      to: session.email_address,
      subject: "Your verification code - "
        <> session.email_address_verification_code,
      html: template.verification_code(session.email_address_verification_code),
    )
    |> result.map_error(ResendEmailSendFailure)

  case result {
    Ok(_) ->
      sign_up_ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> sign_up_ui.verify_email_form()
      |> web.html(200)

    Error(ResendEmailSendFailure(reason)) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(reason))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
  }
}

type CancelError {
  CancelDatabaseFailure(QueryError)
}

pub fn cancel_verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require(req, ctx)

  use form_data <- wisp.require_form(req)

  let result =
    cancel_session(ctx.db, session.id)
    |> result.map_error(CancelDatabaseFailure)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(CancelDatabaseFailure(err)) -> {
      wisp.log_error("cancel verify email failed: " <> string.inspect(err))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
  }
}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require_verified_email_session(req, ctx)

  sign_up_ui.get_set_password_form()
  |> form.add_string("email_address", session.email_address)
  |> sign_up_ui.set_password_form()
  |> sign_up_ui.set_password_page(session.email_address, _)
  |> web.html(200)
}

type SetPasswordError {
  SetPasswordFormError(Form(sign_up_ui.SetPasswordForm))
  SetPasswordEmailAlreadyTaken
  SetPasswordDatabaseFailure(QueryError)
  SetPasswordRecordNotFound
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- require_verified_email_session(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetPasswordFormError),
    )

    use _ <- result.try(ensure_email_available_for_set_password(
      ctx.db,
      session.email_address,
    ))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try(create_user(tx, password_hash, salt, session.id))
        use _ <- result.try(delete_sign_up_session(tx, session.id))
        use new_auth_session <- result.try(create_auth_session(
          tx,
          user.id,
          secret_hash,
        ))
        Ok(new_auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> SetPasswordDatabaseFailure(err)
        }
      }),
    )

    Ok(#(auth_session, secret))
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = auth_session.encode_token(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(SetPasswordFormError(form)) ->
      form
      |> sign_up_ui.set_password_form()
      |> web.html(422)

    Error(SetPasswordEmailAlreadyTaken) ->
      sign_up_ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("This email address is already taken."),
      )
      |> sign_up_ui.set_password_form()
      |> web.html(409)

    Error(SetPasswordRecordNotFound) | Error(SetPasswordDatabaseFailure(_)) -> {
      sign_up_ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> sign_up_ui.set_password_form()
      |> web.html(500)
    }
  }
}

type InternalSignUpSession {
  InternalSignUpSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_sign_up_session(
  db: pog.Connection,
  email: String,
) -> Result(InternalSignUpSession, SessionLookupError) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sign_up_session_sql.create_sign_up_session(
    db,
    secret_hash,
    email,
    verification_code,
  )
  |> result.map_error(SessionDatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(SessionRecordNotFound)
    }
  })
  |> result.map(fn(session) {
    InternalSignUpSession(id: session.id, secret:, verification_code:)
  })
}

fn ensure_email_available(
  db: pog.Connection,
  email: String,
) -> Result(Nil, UserLookupError) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(UserDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(UserNotFound)
    }
  })
}

fn ensure_email_available_for_set_password(
  db: pog.Connection,
  email: String,
) -> Result(Nil, SetPasswordError) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(SetPasswordEmailAlreadyTaken)
    }
  })
}

fn verify_email_address(
  db: pog.Connection,
  session_id: Int,
  stored_code: String,
  submitted_code: String,
) -> Result(Nil, VerifyEmailError) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(VerifyEmailInvalidCode))

  sign_up_session_sql.set_email_address_verified_at_to_now(db, session_id)
  |> result.map_error(fn(err) {
    VerifyEmailSessionUpdateError(SessionDatabaseFailure(err))
  })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) ->
        Error(VerifyEmailSessionUpdateError(SessionRecordNotFound))
    }
  })
}

fn cancel_session(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, QueryError) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.replace(Nil)
}

fn create_user(
  db: pog.Connection,
  raw_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) -> Result(_, SetPasswordError) {
  user_sql.create_user(db, raw_hash, salt, session_id)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(SetPasswordRecordNotFound)
    }
  })
}

fn delete_sign_up_session(
  db: pog.Connection,
  session_id: Int,
) -> Result(Nil, SetPasswordError) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.replace(Nil)
}

fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) -> Result(_, SetPasswordError) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(SetPasswordRecordNotFound)
    }
  })
}
