import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/email
import app/sign_up_session/sql.{type SelectSignUpSessionByIdRow} as sign_up_session_sql
import app/sign_up_session/template
import app/sign_up_session/ui as sign_up_ui
import app/user/sql as user_sql
import app/web
import aws/services/sesv2
import formal/form.{type Form}
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

pub fn require(
  req: Request,
  ctx: Ctx,
  next: fn(SelectSignUpSessionByIdRow) -> Response,
) -> Response {
  let redirect = wisp.redirect("/sign-up") |> clear_cookie(req)

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

type SignUpSessionToken {
  SignUpSessionToken(id: Int, secret: BitArray)
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

  SignUpSessionToken(id:, secret:)
}

type VerifySignUpSessionTokenError {
  TokenInvalid
  TokenExpiredOrNotFound
}

fn verify_token(
  token: SignUpSessionToken,
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

type SignUpError {
  SignUpValidation(form: Form(sign_up_ui.EmailRegisterForm))
  EmailAlreadyTaken
  SignUpDatabaseFailure(QueryError)
  UnexpectedDatabaseResult
  SignUpEmailSendFailure(sesv2.SendEmailError)
}

pub fn view_register_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  sign_up_ui.get_register_form()
  |> sign_up_ui.register_form()
  |> sign_up_ui.register_page()
  |> web.html(200)
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SignUpValidation),
    )

    use _ <- result.try(ensure_email_available(ctx.db, input.email))

    use session <- result.try(create_sign_up_session(ctx.db, input.email))

    use _ <- result.try(
      email.send(
        email: ctx.email,
        to: input.email,
        subject: "Your verification code",
        body: "Your verification code is: " <> session.verification_code,
      )
      |> result.map_error(SignUpEmailSendFailure),
    )

    Ok(encode_token(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> set_cookie(req, token)

    Error(SignUpValidation(form:)) ->
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

    Error(SignUpDatabaseFailure(err)) -> {
      wisp.log_error("sign up: database failure: " <> string.inspect(err))
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }

    Error(UnexpectedDatabaseResult) -> {
      wisp.log_error("sign up: Unexpected database result")
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }

    Error(SignUpEmailSendFailure(reason)) -> {
      wisp.log_error("sign up: " <> string.inspect(reason))
      sign_up_ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.register_form()
      |> web.html(500)
    }
  }
}

fn ensure_email_available(db: pog.Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(SignUpDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

type InternalSignUpSession {
  InternalSignUpSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_sign_up_session(db: pog.Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sign_up_session_sql.create_sign_up_session(
    db,
    secret_hash,
    email,
    verification_code,
  )
  |> result.map_error(SignUpDatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
    }
  })
  |> result.map(fn(session) {
    InternalSignUpSession(id: session.id, secret:, verification_code:)
  })
}

fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

type SharedEmailError {
  EmailAlreadyVerified
}

type VerifyEmailInternalError {
  VerifyEmailDatabaseFailure(QueryError)
}

pub fn view_verify_email_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    Ok(session)
  }

  case result {
    Ok(_) ->
      sign_up_ui.get_verify_email_form()
      |> sign_up_ui.verify_email_form()
      |> sign_up_ui.verify_email_page()
      |> web.html(200)

    Error(EmailAlreadyVerified) -> wisp.redirect("/sign-up/set-password")
  }
}

type VerifyEmailError {
  VerifyEmailValidation(form: Form(sign_up_ui.VerifyEmailAddressForm))
  InvalidVerificationCode
  VerifySharedError(SharedEmailError)
  VerifyInternalError(VerifyEmailInternalError)
}

pub fn verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailValidation),
    )

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(VerifySharedError(EmailAlreadyVerified)),
    )

    verify_email_address(
      ctx.db,
      session.id,
      session.email_address_verification_code,
      form.code,
    )
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifySharedError(EmailAlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifyEmailValidation(form:)) ->
      form
      |> sign_up_ui.verify_email_form()
      |> web.html(422)

    Error(InvalidVerificationCode) ->
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

    Error(VerifyInternalError(VerifyEmailDatabaseFailure(err))) -> {
      wisp.log_error("sign up: verify email error" <> string.inspect(err))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
  }
}

type ResendEmailVerificationError {
  ResendEmailVerificationSharedError(SharedEmailError)
  ResendEmailVerificationFailure(sesv2.SendEmailError)
}

pub fn resend_verify_email_code(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(ResendEmailVerificationSharedError(EmailAlreadyVerified)),
    )

    use _ <- result.try(
      email.send(
        email: ctx.email,
        to: session.email_address,
        subject: "Your verification code",
        body: template.verification_code(
          session.email_address_verification_code,
        ),
      )
      |> result.map_error(ResendEmailVerificationFailure),
    )

    Ok(Nil)
  }

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

    Error(ResendEmailVerificationFailure(reason)) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(reason))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }

    Error(ResendEmailVerificationSharedError(EmailAlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
  }
}

type CancelError {
  CancelSharedError(SharedEmailError)
  CancelInternal(VerifyEmailInternalError)
}

pub fn cancel_verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(CancelSharedError(EmailAlreadyVerified)),
    )

    cancel_email(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(CancelSharedError(EmailAlreadyVerified)) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(CancelInternal(VerifyEmailDatabaseFailure(err))) -> {
      wisp.log_error("cancel verify email failed" <> string.inspect(err))
      sign_up_ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_ui.verify_email_form()
      |> web.html(500)
    }
  }
}

fn verify_email_address(
  db: pog.Connection,
  session_id: Int,
  stored_code: String,
  submitted_code: String,
) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(InvalidVerificationCode))

  mark_email_verified(db, session_id)
}

fn mark_email_verified(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.set_email_address_verified_at_to_now(db, session_id)
  |> result.map_error(fn(err) {
    VerifyInternalError(VerifyEmailDatabaseFailure(err))
  })
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(VerifySharedError(EmailAlreadyVerified))
    }
  })
}

fn cancel_email(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(fn(err) {
    CancelInternal(VerifyEmailDatabaseFailure(err))
  })
  |> result.replace(Nil)
}

type SetPasswordShared {
  EmailNotVerified
}

type SetPasswordError {
  SetPasswordValidation(form: Form(sign_up_ui.SetPasswordForm))
  SetPasswordErrorShared(SetPasswordShared)
  SetPasswordEmailAlreadyTaken
  SetPasswordDatabaseFailure(QueryError)
  SetPasswordUnexpectedDatabaseResult
}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    Ok(session)
  }

  case result {
    Ok(session) ->
      sign_up_ui.get_set_password_form()
      |> form.add_string("email_address", session.email_address)
      |> sign_up_ui.set_password_form()
      |> sign_up_ui.set_password_page()
      |> web.html(200)

    Error(EmailNotVerified) -> wisp.redirect("/sign-up/verify-email-address")
  }
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      sign_up_ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetPasswordValidation),
    )

    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(
      when: not_verified,
      return: Error(SetPasswordErrorShared(EmailNotVerified)),
    )

    use _ <- result.try(ensure_email_available_for_set_password(
      ctx.db,
      session.email_address,
    ))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(form.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try({
          create_user(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_sign_up_session(tx, session.id))

        use auth_session <- result.try({
          create_auth_session(tx, user.id, secret_hash)
        })

        Ok(auth_session)
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

    Error(SetPasswordValidation(form:)) ->
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

    Error(SetPasswordErrorShared(EmailNotVerified)) ->
      wisp.redirect("/sign-up/verify-email-address")

    Error(SetPasswordUnexpectedDatabaseResult)
    | Error(SetPasswordDatabaseFailure(_)) -> {
      sign_up_ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> sign_up_ui.set_password_form()
      |> web.html(500)
    }
  }
}

fn ensure_email_available_for_set_password(db: pog.Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(SetPasswordEmailAlreadyTaken)
    }
  })
}

fn create_user(
  db: pog.Connection,
  raw_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  user_sql.create_user(db, raw_hash, salt, session_id)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(SetPasswordUnexpectedDatabaseResult)
    }
  })
}

fn delete_sign_up_session(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.replace(Nil)
}

fn create_auth_session(
  db: pog.Connection,
  user_id: Int,
  secret_hash: BitArray,
) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(SetPasswordDatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(SetPasswordUnexpectedDatabaseResult)
    }
  })
}
