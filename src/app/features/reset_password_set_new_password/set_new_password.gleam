import app/crypto
import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session_cookie
import app/domain/auth_session/auth_session_token
import app/domain/auth_session/sql as auth_session_sql
import app/domain/password_reset_session/password_reset_session
import app/domain/password_reset_session/password_reset_session_cookie
import app/domain/password_reset_session/sql as password_reset_session_sql
import app/features/reset_password_set_new_password/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog.{type Connection}
import wisp.{type Request, type Response}

type SetNewPasswordError {
  Validation(form: form.Form(ui.SetNewPasswordForm))
  NotVerified
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn set(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_form()
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

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try({
          update_password(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_reset_session(tx, session.id))

        use auth_session <- result.try({
          create_auth_session(tx, session.user_id, secret_hash)
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
      |> password_reset_session_cookie.clear(req)
      |> auth_session_cookie.set(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.form()
      |> web.html(422)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.form()
      |> web.html(500)
  }
}

fn update_password(
  db: Connection,
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
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_reset_session(
  db: Connection,
  session_id: Int,
) -> Result(Nil, SetNewPasswordError) {
  password_reset_session_sql.delete_password_reset_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.map(fn(_) { Nil })
}

fn create_auth_session(
  db: Connection,
  user_id: Int,
  secret_hash: BitArray,
) -> Result(auth_session_sql.CreateAuthSessionRow, SetNewPasswordError) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}
