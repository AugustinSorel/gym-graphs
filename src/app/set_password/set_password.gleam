import app/auth_session/auth_session_cookie
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/set_password/ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql
import app/user/sql as user_sql
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog
import wisp.{type Request, type Response}

type SetPasswordError {
  Validation(form: form.Form(ui.SetPasswordForm))
  InvalidCookie
  InvalidSession
  EmailNotVerified
  EmailAlreadyTaken
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn set(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidCookie),
    )

    use session <- result.try(
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(InvalidSession),
    )

    use <- bool.guard(
      when: option.is_none(session.email_address_verified_at),
      return: Error(EmailNotVerified),
    )

    use _ <- result.try(
      user_sql.select_user_by_email_address(ctx.db, session.email_address)
      |> result.map_error(DatabaseFailure)
      |> result.try(fn(returned) {
        case returned {
          pog.Returned(_, []) -> Ok(Nil)
          pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
        }
      }),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hashed = crypto.hash_user_password(form.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hashed = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try(
          user_sql.create_user(tx, password_hashed.raw_hash, salt, session.id)
          |> result.map_error(DatabaseFailure)
          |> result.try(fn(returned) {
            case returned {
              pog.Returned(_, [user, ..]) -> Ok(user)
              pog.Returned(_, []) -> {
                wisp.log_error("unexpected result in create user")
                Error(UnexpectedDatabaseResult)
              }
            }
          }),
        )

        use _ <- result.try(
          sql.delete_sign_up_session_by_id(tx, session.id)
          |> result.map_error(DatabaseFailure),
        )

        use auth_session <- result.try(
          auth_session_sql.create_auth_session(tx, user.id, secret_hashed)
          |> result.map_error(DatabaseFailure)
          |> result.try(fn(returned) {
            case returned {
              pog.Returned(_, [session, ..]) -> Ok(session)
              pog.Returned(_, []) -> {
                wisp.log_error("unexpected result in create auth session")
                Error(UnexpectedDatabaseResult)
              }
            }
          }),
        )

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
      let token = auth_session_cookie.encode(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> sign_up_session_cookie.clear(req)
      |> auth_session_cookie.set(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(422)

    Error(EmailNotVerified) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "Session expired, please sign up again.")
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)

    Error(EmailAlreadyTaken) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "This email address is already taken.")
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(409)

    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "Something went wrong, please try again.")
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(500)
  }
}
