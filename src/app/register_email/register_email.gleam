import app/crypto
import app/ctx.{type Ctx}
import app/register_email/register_email_ui.{type EmailRegisterForm}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql as sign_up_session_sql
import app/user/sql as user_sql
import app/web
import formal/form.{type Form}
import gleam/result
import pog.{type Connection}
import wisp.{type Request}

type RegisterEmailError {
  Validation(form: Form(EmailRegisterForm))
  DuplicateEmail
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

//TODO: protect routes
pub fn register(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      register_email_ui.get_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use _ <- result.try(ensure_email_available(ctx.db, input))

    use session <- result.try(create_sign_up_session(ctx.db, input.email))

    //TODO: send email code
    echo session.verification_code

    Ok(sign_up_session_token.encode(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/verify-email-address")
      |> sign_up_session_cookie.set(req, token)

    Error(Validation(form:)) ->
      form
      |> register_email_ui.form()
      |> web.html(422)

    Error(DuplicateEmail) ->
      register_email_ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> register_email_ui.form()
      |> web.html(409)

    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      register_email_ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> register_email_ui.form()
      |> web.html(500)
  }
}

fn ensure_email_available(db: Connection, input: EmailRegisterForm) {
  user_sql.select_user_by_email_address(db, input.email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(DuplicateEmail)
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
