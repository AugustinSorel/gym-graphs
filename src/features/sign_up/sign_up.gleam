import app/ctx.{type Ctx}
import app/email.{type SendEmailError}
import app/session
import app/web
import domains/auth_session/auth_session
import domains/sign_up_session/sign_up_session
import domains/sign_up_session/sql
import domains/user/user
import features/auth/auth
import features/sign_up/forms.{
  type EmailRegisterForm, type SetPasswordForm, type VerifyEmailAddressForm,
  get_register_form, get_set_password_form, get_verify_email_form,
}
import features/sign_up/template
import features/sign_up/ui
import formal/form.{type Form}
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_start_page() {
  get_register_form()
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
      get_register_form()
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
      |> session.set_cookie(
        req,
        auth.sign_up_session_cookie().name,
        token,
        auth.sign_up_session_cookie().max_age,
      )
    }
    Error(StartValidationFailed(form)) -> {
      form
      |> ui.register_form()
      |> web.send_html(with_status: 422)
    }
    Error(StartDatabaseFailure(pog.ConstraintViolated(_, "users_email_key", _))) -> {
      get_register_form()
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
      get_register_form()
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
      get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.send_html(with_status: 500)
    }
  }
}

pub fn view_verify_email_page() {
  get_verify_email_form()
  |> ui.verify_email_form(None)
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
      get_verify_email_form()
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
      |> ui.verify_email_form(None)
      |> web.send_html(422)
    }
    Error(VerificationCodeFailed) -> {
      get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_form(None)
      |> web.send_html(422)
    }
    Error(VerifyEmailDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form(None)
      |> web.send_html(500)
    }
  }
}

pub fn cancel(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  let result =
    sign_up_session.delete_by_id(ctx.db, session.id) |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, auth.sign_up_session_cookie().name)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      get_verify_email_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form(None)
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
      get_verify_email_form()
      |> form.add_values(form_data.values)
      |> ui.verify_email_form(
        Some("A new verification code has been sent to your email address."),
      )
      |> web.send_html(200)

    Error(error) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(error))
      get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form(None)
      |> web.send_html(500)
    }
  }
}

pub fn view_set_password_page(session: sql.SelectByIdRow) {
  get_set_password_form()
  |> form.add_string("email", session.email_address)
  |> ui.set_password_form()
  |> ui.set_password_page()
  |> web.send_html(200)
}

pub type SetPasswordError {
  SetPasswordValidation(Form(SetPasswordForm))
  SetPasswordDatabaseFailure(QueryError)
}

pub fn set_password(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetPasswordValidation),
    )

    use Nil <- result.try(
      user.check_if_email_is_available(ctx.db, session.email_address)
      |> result.map_error(SetPasswordDatabaseFailure),
    )

    let name = user.infer_name_from_email(session.email_address)

    pog.transaction(ctx.db, fn(tx) {
      use user <- result.try({
        user.create(tx, input.password, name, session.id)
        |> result.map_error(SetPasswordDatabaseFailure)
      })

      use Nil <- result.try(
        sign_up_session.delete_by_id(tx, session.id)
        |> result.replace(Nil)
        |> result.map_error(SetPasswordDatabaseFailure),
      )

      // FIXME
      //   use _ <- result.try(
      //     seed.seed_user(tx, user.id)
      //     |> result.map_error(SeedAccountFailed),
      //   )

      use #(session, secret) <- result.try(
        auth_session.create(tx, user.id)
        |> result.map_error(SetPasswordDatabaseFailure),
      )

      let token = session.encode_token(session.id, secret)

      Ok(token)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> SetPasswordDatabaseFailure(err)
      }
    })
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.clear_cookie(req, auth.sign_up_session_cookie().name)
      |> session.set_cookie(
        req,
        auth.auth_session_cookie().name,
        token,
        auth.auth_session_cookie().max_age,
      )
    }
    Error(SetPasswordValidation(form)) ->
      form
      |> ui.set_password_form()
      |> web.send_html(422)
    Error(SetPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.set_password_form()
      |> web.send_html(500)
    }
    // Error(SeedAccountFailed(error)) -> {
    //   wisp.log_error(req.path <> " " <> string.inspect(error))
    //   ui.get_set_password_form()
    //   |> form.add_values(formdata.values)
    //   |> form.add_error("root", form.CustomError("Something went wrong"))
    //   |> ui.set_password_form()
    //   |> web.html(500)
    // }
  }
}
