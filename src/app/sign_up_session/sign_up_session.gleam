import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sql.{type SelectSignUpSessionByIdRow} as sign_up_session_sql
import app/sign_up_session/ui
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
import pog.{type Connection, type QueryError}
import wisp.{type Request, type Response}

pub type SignUpError(form) {
  Validation(form: Form(form))
  EmailAlreadyVerified
  InvalidVerificationCode
  EmailNotVerified
  EmailAlreadyTaken
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
}

pub fn view_register_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  ui.get_register_form()
  |> ui.register_form()
  |> ui.register_page()
  |> web.html(200)
}

//FIX: rename this
pub fn register(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use _ <- result.try(ensure_email_available(ctx.db, input.email))

    use session <- result.try(create_sign_up_session(ctx.db, input.email))

    //TODO: send email code
    echo session.verification_code

    Ok(encode_token(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> set_cookie(req, token)

    Error(Validation(form:)) ->
      form
      |> ui.register_form()
      |> web.html(422)

    Error(EmailAlreadyTaken) ->
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> ui.register_form()
      |> web.html(409)

    Error(error) -> {
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.html(500)
    }
  }
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
      ui.get_verify_email_form()
      |> ui.verify_email_form()
      |> ui.verify_email_page()
      |> web.html(200)

    Error(EmailAlreadyVerified) -> wisp.redirect("/sign-up/set-password")

    Error(error) -> {
      ui.get_verify_email_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_email_form()
      |> ui.verify_email_page()
      |> web.html(200)
    }
  }
}

pub fn verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    verify_email_address(
      ctx.db,
      session.id,
      session.email_address_verification_code,
      form.code,
    )
  }

  case result {
    Ok(_) -> {
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
    }

    Error(EmailAlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(Validation(form:)) ->
      form
      |> ui.verify_email_form()
      |> web.html(422)

    Error(InvalidVerificationCode) ->
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_form()
      |> web.html(422)

    Error(error) ->
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
  }
}

pub fn resend_verify_email_code(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    Ok(session)
  }

  case result {
    Ok(session) -> {
      echo session.email_address_verification_code

      // TODO: send verification email with session.email_address_verification_code
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> ui.verify_email_form()
      |> web.html(200)
    }

    Error(EmailAlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(error) -> {
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.verify_email_form()
      |> web.html(500)
    }
  }
}

pub fn cancel_verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(
      when: already_verified,
      return: Error(EmailAlreadyVerified),
    )

    cancel_email(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(EmailAlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(error) ->
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
  }
}

fn ensure_email_available(db: Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

type SignUpSession {
  SignUpSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_sign_up_session(db: Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sign_up_session_sql.create_sign_up_session(
    db,
    secret_hash,
    email,
    verification_code,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
    }
  })
  |> result.map(fn(session) {
    SignUpSession(id: session.id, secret:, verification_code:)
  })
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
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(EmailAlreadyVerified)
    }
  })
}

fn cancel_email(db: Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.replace(Nil)
}

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

pub fn clear_cookie(res: Response, req: Request) -> Response {
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
