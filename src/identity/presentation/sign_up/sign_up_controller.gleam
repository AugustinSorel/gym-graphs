import app/ctx.{type Ctx}
import formal/form.{type Form}
import gleam/option
import gleam/result
import gleam/string
import identity/application/sign_up
import identity/domain/sign_up_session.{type SignUpSession}
import identity/presentation/cookie
import identity/presentation/session_cookie
import identity/presentation/sign_up/forms.{
  type EmailRegisterForm, type VerifyEmailAddressForm,
}
import identity/presentation/sign_up/ui
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_start_page() {
  forms.email_register()
  |> ui.email_register_form()
  |> ui.email_register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type StartError {
  StartValidationFailed(Form(EmailRegisterForm))
  StartDatabaseFailure(QueryError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.email_register()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    use token <- result.try(
      sign_up.start(
        ctx.user_repo(ctx),
        ctx.sign_up_session_repo(ctx),
        ctx.event_publisher(ctx),
        sign_up.CreateInput(email: input.email),
      )
      |> result.map_error(StartDatabaseFailure),
    )

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> session_cookie.set(req, cookie.sign_up_session(), token)

    Error(StartValidationFailed(form)) ->
      form
      |> ui.email_register_form()
      |> element.to_string
      |> wisp.html_response(422)

    Error(StartDatabaseFailure(pog.ConstraintViolated(_, "users_email_key", _))) -> {
      forms.email_register()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> ui.email_register_form()
      |> element.to_string
      |> wisp.html_response(409)
    }

    Error(StartDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.email_register()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.email_register_form()
      |> element.to_string
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_email_page() {
  forms.verify_email_address()
  |> ui.verify_email_form(option.None)
  |> ui.verify_email_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type VerifyEmailError {
  VerifyEmailValidationFailed(Form(VerifyEmailAddressForm))
  VerificationEmailFailed(sign_up.VerifyEmailError)
}

pub fn verify_email(req: Request, session: SignUpSession, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.verify_email_address()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailValidationFailed),
    )

    sign_up.verify_email(ctx.sign_up_session_repo(ctx), session, input.code)
    |> result.map_error(VerificationEmailFailed)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifyEmailValidationFailed(form)) ->
      form
      |> ui.verify_email_form(option.None)
      |> element.to_string
      |> wisp.html_response(422)

    Error(VerificationEmailFailed(sign_up.InvalidCode)) -> {
      forms.verify_email_address()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_form(option.None)
      |> element.to_string
      |> wisp.html_response(422)
    }

    Error(VerificationEmailFailed(sign_up.MarkVerifiedDatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.verify_email_address()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form(option.None)
      |> element.to_string
      |> wisp.html_response(500)
    }
  }
}
