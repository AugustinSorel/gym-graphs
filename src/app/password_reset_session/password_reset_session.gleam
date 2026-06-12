import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/password_reset_session/sql.{type SelectPasswordResetSessionByIdRow} as password_reset_session_sql
import app/password_reset_session/ui
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

type PasswordResetError(form) {
  Validation(form: Form(form))
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
  UserNotFound
  IncorrectCode
  AlreadyVerified
  NotVerified
}

pub fn view_password_reset_page() {
  ui.get_password_reset_form()
  |> ui.password_reset_form()
  |> ui.password_reset_page()
  |> web.html(200)
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use user <- result.try(select_user_by_email(ctx.db, input.email))

    use session <- result.try({
      create_reset_password_session(ctx.db, user.email_address)
    })

    //TODO: send verification code
    echo session.verification_code
    let token = encode_token(session.id, session.secret)

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> set_cookie(req, token)

    Error(Validation(form:)) ->
      form
      |> ui.password_reset_form()
      |> web.html(422)

    Error(UserNotFound) ->
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> ui.password_reset_form()
      |> web.html(404)

    Error(DatabaseFailure(err)) -> {
      wisp.log_error("password reset: database failure: " <> string.inspect(err))
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.password_reset_form()
      |> web.html(500)
    }

    Error(_e) -> {
      wisp.log_error("password reset: unexpected error")
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.password_reset_form()
      |> web.html(500)
    }
  }
}

pub fn view_verify_page(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      ui.get_verify_form()
      |> ui.verify_form(user.email_address)
      |> ui.verify_page()
      |> web.html(200)

    Error(AlreadyVerified) -> wisp.redirect("/reset-password/set-new-password")

    Error(e) ->
      ui.get_verify_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.verify_form("")
      |> ui.verify_page()
      |> web.html(500)
  }
}

fn select_user(db: Connection, session_id: Int) {
  password_reset_session_sql.select_user_by_password_reset_session_id(
    db,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UserNotFound)
    }
  })
}

pub fn cancel(req: Request, ctx: Ctx) {
  use session <- require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result =
    password_reset_session_sql.delete_password_reset_session_by_id(
      ctx.db,
      session.id,
    )
    |> result.map_error(DatabaseFailure)
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> clear_cookie(req)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(e) -> {
      ui.get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.verify_form("")
      |> web.html(500)
    }
  }
}

pub fn verify(req: Request, ctx: Ctx) {
  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let is_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(when: is_verified, return: Error(AlreadyVerified))

    let email_code_hash =
      crypto.hash_password_reset_email_code(input.code, session.email_code_salt)

    let code_correct =
      crypto.validate_session_secret(
        session.email_code_hash,
        email_code_hash.raw_hash,
      )

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    mark_verified(ctx, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(AlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(Validation(form:)) ->
      form
      |> ui.verify_form("")
      |> web.html(422)

    Error(IncorrectCode) ->
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_form("")
      |> web.html(422)

    Error(_e) -> {
      wisp.log_error("password reset: verify error [session_id=" <> int.to_string(session.id) <> "]")
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.verify_form("")
      |> web.html(500)
    }
  }
}

fn mark_verified(ctx: Ctx, session_id: Int) {
  password_reset_session_sql.set_password_reset_session_to_verified_by_id(
    ctx.db,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

// fn select_user(db: Connection, session_id: Int) {
//   password_reset_session_sql.select_user_by_password_reset_session_id(
//     db,
//     session_id,
//   )
//   |> result.map_error(DatabaseFailure)
//   |> result.try(fn(returned) {
//     case returned {
//       pog.Returned(_, [user, ..]) -> Ok(user)
//       pog.Returned(_, []) -> Error(UserNotFound)
//     }
//   })
// }

type ResetPasswordSession {
  ResetPasswordSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_reset_password_session(db: Connection, email_address: String) {
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
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_count, []) -> Error(UnexpectedDatabaseResult)
      pog.Returned(_count, [session, ..]) -> {
        Ok(ResetPasswordSession(session.id, secret, email_code))
      }
    }
  })
}

fn select_user_by_email(db: Connection, email) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_count, []) -> Error(UserNotFound)
      pog.Returned(_count, [user, ..]) -> Ok(user)
    }
  })
}

pub fn require(
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

fn set_cookie(res, req, value) {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(1) |> duration.to_seconds() |> float.round(),
  )
}

pub fn clear_cookie(res, req) {
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

pub fn encode_token(id: Int, secret: BitArray) -> String {
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

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      ui.get_set_new_password_form()
      |> form.add_string("email_address", user.email_address)
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(200)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(_) ->
      ui.get_set_new_password_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(500)
  }
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use new_auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try({
          update_password(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_reset_session(tx, session.id))

        use new_auth_session <- result.try({
          create_auth_session(tx, session.user_id, secret_hash)
        })

        Ok(new_auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(new_auth_session, secret))
  }

  case result {
    Ok(#(new_auth_session, secret)) -> {
      let token = encode_token(new_auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.set_new_password_form()
      |> web.html(422)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(error) -> {
      wisp.log_error("password reset: set new password error [session_id=" <> int.to_string(session.id) <> "]")
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.set_new_password_form()
      |> web.html(500)
    }
  }
}

fn update_password(
  db: Connection,
  password_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  password_reset_session_sql.update_user_password_by_id(
    db,
    password_hash,
    salt,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_reset_session(db: Connection, session_id: Int) {
  password_reset_session_sql.delete_password_reset_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.map(fn(_) { Nil })
}

fn create_auth_session(db: Connection, user_id: Int, secret_hash: BitArray) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}
