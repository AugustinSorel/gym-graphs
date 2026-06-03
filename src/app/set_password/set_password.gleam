import app/auth_session/auth_session
import app/auth_session/auth_session_cookie
import app/auth_session/auth_session_token
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/set_password/ui
import app/sign_up_session/sign_up_session
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sql
import app/user/sql as user_sql
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog.{type Connection}
import wisp.{type Request, type Response}

type SetPasswordError {
  Validation(form: form.Form(ui.SetPasswordForm))
  InvalidSignUpSession
  EmailNotVerified
  EmailAlreadyTaken
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn set(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    use _ <- result.try(verify_email_available(ctx.db, session.email_address))

    let salt = crypto.generate_hashing_salt()
    let password_hashed = crypto.hash_user_password(form.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try({
          create_user(tx, password_hashed.raw_hash, salt, session.id)
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
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(auth_session, secret))
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = auth_session_token.encode(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> sign_up_session_cookie.clear(req)
      |> auth_session_cookie.set(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.set_password_form()
      |> web.html(422)

    Error(EmailNotVerified) ->
      wisp.redirect("/verify-email-address")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSession) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(EmailAlreadyTaken) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("This email address is already taken."),
      )
      |> ui.set_password_form()
      |> web.html(409)

    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.set_password_form()
      |> web.html(500)
  }
}

fn verify_email_available(
  db: Connection,
  email: String,
) -> Result(Nil, SetPasswordError) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

fn create_user(
  db: Connection,
  raw_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  user_sql.create_user(db, raw_hash, salt, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_sign_up_session(db: Connection, session_id: Int) {
  sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
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
