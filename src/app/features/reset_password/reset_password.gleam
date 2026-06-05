import app/crypto
import app/ctx.{type Ctx}
import app/domain/password_reset_session/password_reset_session_cookie
import app/domain/password_reset_session/password_reset_session_token
import app/domain/password_reset_session/sql as password_reset_sql
import app/domain/user/sql as user_sql
import app/features/reset_password/ui.{type ResetPasswordForm}
import app/web
import formal/form.{type Form}
import gleam/result
import pog.{type Connection, type QueryError}
import wisp.{type Request, type Response}

type RegisterError {
  Validation(form: Form(ResetPasswordForm))
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
  UserNotFound
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_form()
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

    let token = password_reset_session_token.encode(session.id, session.secret)

    Ok(token)
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> password_reset_session_cookie.set(req, token)
    }
    Error(Validation(form:)) -> {
      form
      |> ui.form()
      |> web.html(422)
    }
    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.form()
      |> web.html(500)
    Error(UserNotFound) ->
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> ui.form()
      |> web.html(404)
  }
}

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

  password_reset_sql.create_password_reset_session(
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
