import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/email.{type SendEmailError}
import app/session
import app/sign_up/sign_up
import app/sign_up/template
import app/sign_up/ui.{
  type EmailRegisterForm, type SetPasswordForm, type VerifyEmailAddressForm,
}
import app/user/user.{type CheckIfEmailIsAvailable}
import app/web
import formal/form.{type Form}
import gleam/result
import gleam/string
import pog
import wisp.{type Request, type Response}

pub fn view_register_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  ui.get_register_form()
  |> ui.register_form()
  |> ui.register_page()
  |> web.html(200)
}

pub fn view_verify_email_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use _session <- sign_up.require_unverified(req, ctx)

  ui.get_verify_email_form()
  |> ui.verify_email_form()
  |> ui.verify_email_page()
  |> web.html(200)
}

type SignUpStartError {
  StartValidationFailed(Form(EmailRegisterForm))
  EmailAvailabilityError(CheckIfEmailIsAvailable)
  SessionCreationFailed(db.DatabaseError)
  VerificationCodeDeliveryFailed(SendEmailError)
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

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
      |> result.map_error(EmailAvailabilityError),
    )

    use #(id, secret, verification_code) <- result.try(
      sign_up.create(ctx.db, input.email)
      |> result.map_error(SessionCreationFailed),
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
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> session.set_cookie(
        req,
        sign_up.cookie_name,
        token,
        sign_up.cookie_max_age(),
      )

    Error(StartValidationFailed(form)) ->
      form
      |> ui.register_form()
      |> web.html(422)

    Error(EmailAvailabilityError(user.EmailConflict)) ->
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> ui.register_form()
      |> web.html(409)
    Error(EmailAvailabilityError(user.CheckIfEmailIsAvailableDatabaseFailure(
      error,
    )))
    | Error(SessionCreationFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.html(500)
    }
    Error(SessionCreationFailed(db.RowNotFound)) -> {
      wisp.log_error(
        req.path
        <> " Unexpected database returned when creating sign up session",
      )
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.html(500)
    }
    Error(VerificationCodeDeliveryFailed(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.html(500)
    }
  }
}

type SignUpVerifyEmailError {
  VerifyEmailValidationFailed(Form(VerifyEmailAddressForm))
  VerifyCodeFailed
  MarkEmailAsVerifiedFailed(db.DatabaseError)
}

pub fn verify_email(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- sign_up.require_unverified(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailValidationFailed),
    )

    use Nil <- result.try(
      sign_up.verify_code(session.email_address_verification_code, input.code)
      |> result.replace_error(VerifyCodeFailed),
    )

    sign_up.mark_email_as_verified(ctx.db, session.id)
    |> result.map_error(MarkEmailAsVerifiedFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")

    Error(VerifyEmailValidationFailed(form)) ->
      form
      |> ui.verify_email_form()
      |> web.html(422)

    Error(VerifyCodeFailed) ->
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_email_form()
      |> web.html(422)

    Error(MarkEmailAsVerifiedFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
    }
    Error(MarkEmailAsVerifiedFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " unexpected database return")
      ui.get_verify_email_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
    }
  }
}

type ResendVerifyEmailCode {
  ResendVerificationCodeDeliveryFailed(SendEmailError)
}

pub fn resend_verify_email_code(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- sign_up.require_unverified(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = {
    email.send(
      email: ctx.email,
      to: session.email_address,
      subject: "Your verification code - "
        <> session.email_address_verification_code,
      html: template.verification_code(session.email_address_verification_code),
    )
    |> result.map_error(ResendVerificationCodeDeliveryFailed)
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
      |> web.html(200)

    Error(ResendVerificationCodeDeliveryFailed(reason)) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(reason))
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
    }
  }
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- sign_up.require(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = sign_up.delete_by_id(ctx.db, session.id) |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, sign_up.cookie_name)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
    }
    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> " unexpected database return")
      ui.get_verify_email_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_email_form()
      |> web.html(500)
    }
  }
}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- sign_up.require_verified(req, ctx)

  ui.get_set_password_form()
  |> form.add_string("email", session.email_address)
  |> ui.set_password_form()
  |> ui.set_password_page()
  |> web.html(200)
}

pub type SetPasswordError {
  SetPasswordValidation(Form(SetPasswordForm))
  SetPasswordEmailAvailabilityError(CheckIfEmailIsAvailable)
  CreateUserFailed(db.DatabaseError)
  DeleteSignUpSessionFailed(db.DatabaseError)
  CreateAuthSessionFailed(db.DatabaseError)
  TransactionFailed(pog.QueryError)
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)
  use session <- sign_up.require_verified(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetPasswordValidation),
    )

    use Nil <- result.try(
      user.check_if_email_is_available(ctx.db, session.email_address)
      |> result.map_error(SetPasswordEmailAvailabilityError),
    )

    let name = user.infer_name_from_email(session.email_address)

    pog.transaction(ctx.db, fn(tx) {
      use user <- result.try({
        user.create(tx, input.password, name, session.id)
        |> result.map_error(CreateUserFailed)
      })

      use Nil <- result.try(
        sign_up.delete_by_id(tx, session.id)
        |> result.replace(Nil)
        |> result.map_error(DeleteSignUpSessionFailed),
      )

      use session <- result.try(
        auth_session.create(tx, user.id)
        |> result.map_error(CreateAuthSessionFailed),
      )

      Ok(session)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> TransactionFailed(err)
      }
    })
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = session.encode_token(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.clear_cookie(req, sign_up.cookie_name)
      |> session.set_cookie(
        req,
        auth_session.cookie_name,
        token,
        auth_session.cookie_max_age(),
      )
    }

    Error(SetPasswordValidation(form)) ->
      form
      |> ui.set_password_form()
      |> web.html(422)

    Error(SetPasswordEmailAvailabilityError(user.EmailConflict)) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("This email address is already taken."),
      )
      |> ui.set_password_form()
      |> web.html(409)
    Error(SetPasswordEmailAvailabilityError(user.CheckIfEmailIsAvailableDatabaseFailure(
      error,
    )))
    | Error(TransactionFailed(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.set_password_form()
      |> web.html(500)
    }

    Error(CreateUserFailed(error))
    | Error(DeleteSignUpSessionFailed(error))
    | Error(CreateAuthSessionFailed(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.set_password_form()
      |> web.html(500)
    }
  }
}
