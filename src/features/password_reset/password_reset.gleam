import app/crypto
import app/ctx.{type Ctx}
import app/email.{type SendEmailError}
import app/session
import app/web
import domains/auth_session/auth_session
import domains/password_reset/password_reset
import domains/password_reset/sql
import domains/user/user
import features/auth/auth
import features/password_reset/forms.{
  type ResetPasswordForm, type SetNewPasswordForm, type VerifyEmailCodeForm,
}
import features/password_reset/template
import features/password_reset/ui
import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_page() {
  forms.get_password_reset_form()
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
      forms.get_password_reset_form()
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
      forms.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.send_html(500)
    }

    Error(SendingVerificationCodeFailed(reason)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(reason))
      forms.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.send_html(500)
    }
  }
}

pub fn view_verify_page() {
  forms.get_verify_form()
  |> ui.verify_form()
  |> ui.verify_page()
  |> web.send_html(200)
}

pub type VerifyError {
  VerifyErrorValidation(Form(VerifyEmailCodeForm))
  IncorrectCode
  VerifyDatabaseFailure(QueryError)
}

pub fn verify(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyErrorValidation),
    )

    let code_correct =
      crypto.validate_user_password(session.email_code_hash, input.code)

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    password_reset.mark_as_verified(ctx.db, session.id)
    |> result.map_error(VerifyDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifyErrorValidation(form)) ->
      form
      |> ui.verify_form()
      |> web.send_html(422)

    Error(IncorrectCode) ->
      forms.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_form()
      |> web.send_html(422)

    Error(VerifyDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.send_html(500)
    }
  }
}

pub fn cancel(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result = {
    password_reset.delete_by_id(ctx.db, session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, auth.password_reset_cookie().name)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.send_html(500)
    }
  }
}

//FIX sql.selectbyidrow
pub fn view_set_new_password_page(
  req: Request,
  session: sql.SelectByIdRow,
  ctx: Ctx,
) {
  let result = user.select_by_password_reset_id(ctx.db, session.id)

  case result {
    Ok(user) ->
      forms.get_set_new_password_form()
      |> form.add_string("email", user.email_address)
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.send_html(200)

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_set_new_password_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.send_html(500)
    }
  }
}

type ResetPasswordError {
  ResetPasswordValidation(Form(SetNewPasswordForm))
  ResetPasswordDatabaseFailure(QueryError)
}

pub fn set_new_password(req: Request, session: sql.SelectByIdRow, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(ResetPasswordValidation),
    )

    let password_hash = crypto.hash_user_password(input.password)

    pog.transaction(ctx.db, fn(tx) {
      use Nil <- result.try({
        user.update_password_by_password_reset_id(tx, password_hash, session.id)
        |> result.map_error(ResetPasswordDatabaseFailure)
        |> result.replace(Nil)
      })

      use Nil <- result.try(
        password_reset.delete_by_id(tx, session.id)
        |> result.replace(Nil)
        |> result.map_error(ResetPasswordDatabaseFailure),
      )

      use #(session, secret) <- result.try({
        auth_session.create(tx, session.user_id)
        |> result.map_error(ResetPasswordDatabaseFailure)
      })

      let token = session.encode_token(session.id, secret)

      Ok(token)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> ResetPasswordDatabaseFailure(err)
      }
    })
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.clear_cookie(req, auth.password_reset_cookie().name)
      |> session.set_cookie(
        req,
        auth.auth_session_cookie().name,
        token,
        auth.auth_session_cookie().max_age,
      )
    }

    Error(ResetPasswordValidation(form)) ->
      form
      |> ui.set_new_password_form()
      |> web.send_html(422)

    Error(ResetPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.send_html(500)
    }
  }
}
