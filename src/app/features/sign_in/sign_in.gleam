import app/crypto
import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/domain/auth_session/auth_session_cookie
import app/domain/auth_session/auth_session_token
import app/domain/auth_session/sql as auth_session_sql
import app/domain/user/sql as user_sql
import app/features/sign_in/ui.{type SignInForm}
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/result
import pog
import wisp.{type Request, type Response}

type SignInError {
  Validation(form: Form(SignInForm))
  InvalidCredentials
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn sign_in(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use user <- result.try(
      user_sql.select_user_by_email_address(ctx.db, input.email)
      |> result.map_error(DatabaseFailure)
      |> result.try(fn(returned) {
        case returned {
          pog.Returned(_, [user, ..]) -> Ok(user)
          pog.Returned(_, []) -> Error(InvalidCredentials)
        }
      }),
    )

    let password_valid =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      auth_session_sql.create_auth_session(ctx.db, user.id, secret_hash)
      |> result.map_error(DatabaseFailure)
      |> result.try(fn(returned) {
        case returned {
          pog.Returned(_, [session, ..]) -> Ok(session)
          pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
        }
      }),
    )

    Ok(#(auth_session.id, secret))
  }

  case result {
    Ok(#(session_id, secret)) -> {
      let token = auth_session_token.encode(session_id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> auth_session_cookie.set(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.form()
      |> web.html(422)

    Error(InvalidCredentials) ->
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> ui.form()
      |> web.html(401)

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
