import app/ctx.{type Ctx}
import app/email.{type SendEmailError}
import app/session
import app/web
import domains/sign_up_session/sign_up_session
import domains/sign_up_session/sql
import domains/user/user
import features/sign_up/template
import features/sign_up/ui.{type EmailRegisterForm, type VerifyEmailAddressForm}
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

pub type VerifyEmailError {
  VerifyEmailValidationFailed(Form(VerifyEmailAddressForm))
  VerificationCodeFailed
  VerifyEmailDatabaseFailure(QueryError)
}

pub fn verify_email(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailValidationFailed),
    )

    use Nil <- result.try(
      sign_up_session.verify_code(
        session.email_address_verification_code,
        input.code,
      )
      |> result.replace_error(VerificationCodeFailed),
    )

    sign_up_session.mark_email_as_verified(ctx.db, session.id)
    |> result.map_error(VerifyEmailDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) -> {
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
    }
    Error(VerifyEmailValidationFailed(form)) -> {
      form
      |> ui.verify_email_form()
      |> web.send_html(422)
    }
    Error(VerificationCodeFailed) -> {
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_form()
      |> web.send_html(422)
    }
    Error(VerifyEmailDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.send_html(500)
    }
  }
}

pub fn cancel(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result =
    sign_up_session.delete_by_id(ctx.db, session.id) |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, cookie)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.send_html(500)
    }
  }
}

pub fn resend_verify_email_code(
  req: Request,
  session: sql.SelectByIdRow,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let result = {
    email.send(
      email: ctx.email,
      to: session.email_address,
      subject: "Your verification code - "
        <> session.email_address_verification_code,
      html: template.verification_code(session.email_address_verification_code),
    )
  }

  case result {
    Ok(Nil) ->
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> ui.verify_email_form()
      |> web.send_html(200)

    Error(error) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(error))
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.send_html(500)
    }
  }
}
