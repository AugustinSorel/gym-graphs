import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sql as sign_up_session_sql
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog
import wisp.{type Request}

type VerifyError {
  Validation(form: form.Form(ui.VerifyEmailAddressForm))
  InvalidSignUpSession
  InvalidCode
  AlreadyVerified
  DatabaseFailure(pog.QueryError)
  UnexpectedResult
}

pub fn verify(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

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
      |> wisp.set_header("HX-Redirect", "/set-password")
    }

    Error(AlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/set-password")

    Error(Validation(form:)) ->
      form
      |> ui.verify_email_address_form()
      |> web.html(422)

    Error(InvalidSignUpSession) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidCode) ->
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_address_form()
      |> web.html(422)

    Error(DatabaseFailure(_)) | Error(UnexpectedResult) ->
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.verify_email_address_form()
      |> web.html(500)
  }
}

fn verify_email_address(
  db: pog.Connection,
  session_id: Int,
  stored_code: String,
  submitted_code: String,
) {
  let is_valid = crypto.validate_verification_code(stored_code, submitted_code)

  use <- bool.guard(when: !is_valid, return: Error(InvalidCode))

  mark_email_verified(db, session_id)
}

fn mark_email_verified(db: pog.Connection, session_id: Int) {
  sign_up_session_sql.set_email_address_verified_at_to_now(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(AlreadyVerified)
    }
  })
}
