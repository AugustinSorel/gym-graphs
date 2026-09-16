import app/ctx.{type Ctx}
import app/email.{type SendEmailError}
import app/session
import app/web
import domains/sign_up_session/sign_up_session
import domains/user/user
import features/sign_up/template
import features/sign_up/ui.{type EmailRegisterForm}
import formal/form.{type Form}
import gleam/float
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type QueryError}
import wisp.{type Request}

const cookie = "sign_up_session_token"

fn cookie_max_age() {
  duration.hours(24) |> duration.to_seconds() |> float.round()
}

pub fn view_start_page() {
  ui.get_register_form()
  |> ui.register_form()
  |> ui.register_page()
  |> web.send_html(with_status: 200)
}

pub type StartError {
  StartValidationFailed(Form(EmailRegisterForm))
  StartDatabaseFailure(QueryError)
  VerificationCodeDeliveryFailed(SendEmailError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    use Nil <- result.try(
      user.check_if_email_is_available(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure),
    )

    use #(id, secret, verification_code) <- result.try(
      sign_up_session.create(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure),
    )

    use Nil <- result.try(
      email.send(
        email: ctx.email,
        to: input.email,
        subject: "Your verification code - " <> verification_code,
        html: template.verification_code(verification_code),
      )
      |> result.map_error(VerificationCodeDeliveryFailed),
    )

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> session.set_cookie(req, cookie, token, cookie_max_age())
    }
    Error(StartValidationFailed(form)) -> {
      form
      |> ui.register_form()
      |> web.send_html(with_status: 422)
    }
    Error(StartDatabaseFailure(pog.ConstraintViolated(_, "users_email_key", _))) -> {
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> ui.register_form()
      |> web.send_html(with_status: 409)
    }
    Error(VerificationCodeDeliveryFailed(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Failed to send verification email. Please try again."),
      )
      |> ui.register_form()
      |> web.send_html(with_status: 500)
    }
    Error(StartDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.send_html(with_status: 500)
    }
  }
}

pub fn view_verify_email_page() {
  ui.get_verify_email_form()
  |> ui.verify_email_form()
  |> ui.verify_email_page()
  |> web.send_html(200)
}
