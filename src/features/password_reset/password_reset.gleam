import app/ctx.{type Ctx}
import app/email.{type SendEmailError}
import app/session
import app/web
import domains/password_reset/password_reset
import domains/user/user
import features/auth/auth
import features/password_reset/template
import features/password_reset/ui.{type ResetPasswordForm}
import formal/form.{type Form}
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_page() {
  ui.get_password_reset_form()
  |> ui.password_reset_form()
  |> ui.password_reset_page()
  |> web.send_html(200)
}

pub type StartError {
  StartValidation(Form(ResetPasswordForm))
  StartDatabaseFailure(QueryError)
  SendingVerificationCodeFailed(SendEmailError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidation),
    )

    use user <- result.try(
      user.select_by_email(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure),
    )

    use #(id, secret, email_code) <- result.try(
      password_reset.create(ctx.db, user.email_address)
      |> result.map_error(StartDatabaseFailure),
    )

    use Nil <- result.try(
      email.send(
        email: ctx.email,
        to: user.email_address,
        subject: "Your password reset code - " <> email_code,
        html: template.register_code(email_code),
      )
      |> result.map_error(SendingVerificationCodeFailed),
    )

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> session.set_cookie(
        req,
        auth.password_reset_cookie().name,
        token,
        auth.password_reset_cookie().max_age,
      )

    Error(StartValidation(form)) ->
      form
      |> ui.password_reset_form()
      |> web.send_html(422)

    Error(StartDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.send_html(500)
    }

    Error(SendingVerificationCodeFailed(reason)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(reason))
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.send_html(500)
    }
  }
}
