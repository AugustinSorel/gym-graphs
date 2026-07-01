import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/email
import app/password_reset/password_reset
import app/password_reset/template
import app/password_reset/ui.{type ResetPasswordForm}
import app/session
import app/user/user
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request, type Response}

pub fn view_password_reset_page() -> Response {
  ui.get_password_reset_form()
  |> ui.password_reset_form()
  |> ui.password_reset_page()
  |> web.html(200)
}

pub type StartError {
  StartValidation(Form(ResetPasswordForm))
  SelectUserFailed(db.DatabaseError)
  CreatePasswordResetSessionFailed(db.DatabaseError)
  SendingVerificationCodeFailed(email.SendEmailError)
}

pub fn start(req: Request, ctx: Ctx) -> Response {
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
      |> result.map_error(SelectUserFailed),
    )

    use #(id, secret, email_code) <- result.try(
      password_reset.create(ctx.db, user.email_address)
      |> result.map_error(CreatePasswordResetSessionFailed),
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
        password_reset.cookie_name,
        token,
        password_reset.cookie_max_age(),
      )

    Error(StartValidation(form)) ->
      form
      |> ui.password_reset_form()
      |> web.html(422)

    Error(SelectUserFailed(db.RowNotFound)) ->
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> ui.password_reset_form()
      |> web.html(404)

    Error(SelectUserFailed(db.DatabaseFailure(error)))
    | Error(CreatePasswordResetSessionFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.html(500)
    }

    Error(CreatePasswordResetSessionFailed(db.RowNotFound)) -> {
      wisp.log_error("password reset: unexpected database result")
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.html(500)
    }

    Error(SendingVerificationCodeFailed(reason)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(reason))
      ui.get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.password_reset_form()
      |> web.html(500)
    }
  }
}

pub fn view_verify_page(req: Request, ctx: Ctx) -> Response {
  use _session <- password_reset.require_unverified(req, ctx)

  ui.get_verify_form()
  |> ui.verify_form()
  |> ui.verify_page()
  |> web.html(200)
}

pub type VerifyError {
  VerifyErrorValidation(Form(ui.VerifyEmailCodeForm))
  IncorrectCode
  VerifyFailed(db.DatabaseError)
}

pub fn verify(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset.require_unverified(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyErrorValidation),
    )

    let email_code_hash =
      crypto.hash_password_reset_email_code(input.code, session.email_code_salt)

    let code_correct =
      crypto.validate_session_secret(
        session.email_code_hash,
        email_code_hash.raw_hash,
      )

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    password_reset.mark_as_verified(ctx.db, session.id)
    |> result.map_error(VerifyFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifyErrorValidation(form)) ->
      form
      |> ui.verify_form()
      |> web.html(422)

    Error(IncorrectCode) ->
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.verify_form()
      |> web.html(422)

    Error(VerifyFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.html(500)
    }
    Error(VerifyFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " Unexpected database return")
      ui.get_verify_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.html(500)
    }
  }
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset.require(req, ctx)

  use form_data <- wisp.require_form(req)

  let result =
    password_reset.delete_by_id(ctx.db, session.id) |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, password_reset.cookie_name)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.html(500)
    }

    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> " Unexpected database failure")
      ui.get_verify_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_form()
      |> web.html(500)
    }
  }
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset.require_verified(req, ctx)

  let result = user.select_by_password_reset_id(ctx.db, session.id)

  case result {
    Ok(user) ->
      ui.get_set_new_password_form()
      |> form.add_string("email", user.email_address)
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(200)

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(500)
    }
    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> " Unexpected database return")
      ui.get_set_new_password_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(500)
    }
  }
}

type ResetPasswordError {
  ResetPasswordValidation(Form(ui.SetNewPasswordForm))
  DeletePasswordResetSessionFailure(db.DatabaseError)
  CreatingAuthSessionFailure(db.DatabaseError)
  TransactionError(QueryError)
  ResetPasswordFailed(db.DatabaseError)
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset.require_verified(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(ResetPasswordValidation),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)

    pog.transaction(ctx.db, fn(tx) {
      use Nil <- result.try({
        user.update_password_by_password_reset_id(
          tx,
          password_hash,
          salt,
          session.id,
        )
        |> result.map_error(ResetPasswordFailed)
        |> result.replace(Nil)
      })

      use Nil <- result.try(
        password_reset.delete_by_id(tx, session.id)
        |> result.replace(Nil)
        |> result.map_error(DeletePasswordResetSessionFailure),
      )

      use #(session, secret) <- result.try({
        auth_session.create(tx, session.user_id)
        |> result.map_error(CreatingAuthSessionFailure)
      })

      let token = session.encode_token(session.id, secret)

      Ok(token)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> TransactionError(err)
      }
    })
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.clear_cookie(req, password_reset.cookie_name)
      |> session.set_cookie(
        req,
        auth_session.cookie_name,
        token,
        auth_session.cookie_max_age(),
      )
    }

    Error(ResetPasswordValidation(form)) ->
      form
      |> ui.set_new_password_form()
      |> web.html(422)

    Error(DeletePasswordResetSessionFailure(db.DatabaseFailure(error)))
    | Error(CreatingAuthSessionFailure(db.DatabaseFailure(error)))
    | Error(ResetPasswordFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }

    Error(DeletePasswordResetSessionFailure(db.RowNotFound))
    | Error(CreatingAuthSessionFailure(db.RowNotFound))
    | Error(ResetPasswordFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " Unexpected database return")
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }

    Error(TransactionError(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }
  }
}
