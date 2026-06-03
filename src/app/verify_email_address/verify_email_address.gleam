import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql as sign_up_session_sql
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/bool
import gleam/result
import pog
import wisp.{type Request}

type VerifyError {
  Validation(form: form.Form(ui.VerifyEmailAddressForm))
  InvalidCookie
  InvalidSession
  InvalidCode
  AlreadyVerified
  DatabaseFailure(pog.QueryError)
  UnexpectedResult
}

pub fn verify(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_verify_email_address_form()
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

    verify_idk(
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

    Error(AlreadyVerified) -> wisp.redirect("/set-password")

    Error(Validation(form:)) ->
      form
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(422)

    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "Session expired, please sign up again.")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)

    Error(InvalidCode) ->
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "Invalid verification code.")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)

    Error(DatabaseFailure(_)) | Error(UnexpectedResult) ->
      ui.get_verify_email_address_form()
      |> form.add_values(formdata.values)
      |> form.add_string("root", "Something went wrong, please try again.")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
  }
}

fn verify_idk(
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
  |> result.try(fn(result) {
    case result {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(AlreadyVerified)
    }
  })
}
