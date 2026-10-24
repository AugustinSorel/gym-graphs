import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/password_reset_session.{type PasswordResetSession}
import gym_graphs/domains/session
import gym_graphs/mailers/email_template
import gym_graphs/mailers/mailer.{type SendError}
import gym_graphs/repos/auth_session_repo
import gym_graphs/repos/password_reset_session_repo
import gym_graphs/repos/user_repo
import gym_graphs/schemas/password_reset_session_schema.{
  type ResetPasswordSchema, type SetNewPasswordSchema,
  type VerifyEmailCodeSchema,
}
import gym_graphs/views/password_reset_session_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_page() {
  password_reset_session_schema.start()
  |> password_reset_session_view.password_reset_form()
  |> password_reset_session_view.password_reset_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type StartError {
  StartValidation(Form(ResetPasswordSchema))
  StartDatabaseFailure(QueryError)
  SendingVerificationCodeFailed(SendError)
  UserNotFound
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_session_schema.start()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidation),
    )

    use user <- result.try(
      user_repo.select_by_email(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure)
      |> result.try(option.to_result(_, UserNotFound)),
    )

    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)

    let code = password_reset_session.generate_email_verification_code()
    let code_hash = password_reset_session.hash_email_verification_code(code)

    use password_reset_session_id <- result.try(
      password_reset_session_repo.create(
        ctx.db,
        secret_hash,
        code_hash,
        user.email,
      )
      |> result.map_error(StartDatabaseFailure),
    )

    let #(subject, html) = email_template.reset_password_code(code)

    let config = mailer.new_config(user.email, subject, html)

    use Nil <- result.try(
      mailer.send(ctx.mailer, config)
      |> result.map_error(SendingVerificationCodeFailed),
    )

    Ok(session.encode_token(password_reset_session_id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> wisp.set_cookie(
        req,
        name: cookie.password_reset().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.password_reset().max_age,
      )
    Error(StartValidation(form)) ->
      form
      |> password_reset_session_view.password_reset_form()
      |> element.to_string()
      |> wisp.html_response(422)
    Error(UserNotFound) ->
      password_reset_session_schema.start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> password_reset_session_view.password_reset_form()
      |> element.to_string()
      |> wisp.html_response(404)
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_reset_session_schema.start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_reset_session_view.password_reset_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_page() {
  password_reset_session_schema.verify()
  |> password_reset_session_view.verify_form()
  |> password_reset_session_view.verify_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type VerifyError {
  VerifyErrorValidation(Form(VerifyEmailCodeSchema))
  InvalidCode
  VerifyDatabaseFailure(QueryError)
}

pub fn verify(
  req: Request,
  password_reset_session: PasswordResetSession,
  ctx: Ctx,
) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_session_schema.verify()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyErrorValidation),
    )

    let valid_code =
      password_reset_session.verify(
        password_reset_session.email_code_hash,
        input.code,
      )

    use <- bool.guard(when: !valid_code, return: Error(InvalidCode))

    password_reset_session_repo.verify_by_id(ctx.db, password_reset_session.id)
    |> result.map_error(VerifyDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(VerifyErrorValidation(form)) ->
      form
      |> password_reset_session_view.verify_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(InvalidCode) ->
      password_reset_session_schema.verify()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> password_reset_session_view.verify_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(VerifyDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_reset_session_schema.verify()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_reset_session_view.verify_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn cancel(
  req: Request,
  password_reset_session: PasswordResetSession,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let result = {
    password_reset_session_repo.delete_by_id(ctx.db, password_reset_session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_cookie(req, cookie.password_reset().name, "", wisp.Signed, 0)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_reset_session_schema.verify()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_reset_session_view.verify_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_set_new_password_page(
  req: Request,
  password_reset_session: PasswordResetSession,
  ctx: Ctx,
) {
  let result =
    user_repo.select_by_password_reset_session_id(
      ctx.db,
      password_reset_session.id,
    )

  case result {
    Ok(option.Some(user)) ->
      password_reset_session_schema.set_new_password()
      |> form.add_string("email", user.email.value)
      |> password_reset_session_view.set_new_password_form()
      |> password_reset_session_view.set_new_password_page()
      |> element.to_string()
      |> wisp.html_response(200)
    Ok(option.None) ->
      password_reset_session_schema.set_new_password()
      |> form.add_error("root", form.CustomError("user not found"))
      |> password_reset_session_view.set_new_password_form()
      |> password_reset_session_view.set_new_password_page()
      |> element.to_string()
      |> wisp.html_response(404)

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_reset_session_schema.set_new_password()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_reset_session_view.set_new_password_form()
      |> password_reset_session_view.set_new_password_page()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type ResetPasswordError {
  ResetPasswordValidation(Form(SetNewPasswordSchema))
  ResetPasswordDatabaseFailure(QueryError)
}

pub fn set_new_password(
  req: Request,
  password_reset_session: PasswordResetSession,
  ctx: Ctx,
) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      password_reset_session_schema.set_new_password()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(ResetPasswordValidation),
    )

    pog.transaction(ctx.db, fn(tx) {
      use Nil <- result.try({
        user_repo.update_password_hash_by_password_reset_session_id(
          tx,
          input.password,
          password_reset_session.id,
        )
        |> result.map_error(ResetPasswordDatabaseFailure)
        |> result.replace(Nil)
      })

      use Nil <- result.try(
        password_reset_session_repo.delete_by_id(tx, password_reset_session.id)
        |> result.replace(Nil)
        |> result.map_error(ResetPasswordDatabaseFailure),
      )

      let secret = session.generate_secret()
      let secret_hash = session.hash_secret(secret)

      use auth_session_id <- result.try({
        auth_session_repo.create(
          tx,
          password_reset_session.user_id,
          secret_hash,
        )
        |> result.map_error(ResetPasswordDatabaseFailure)
      })

      let token = session.encode_token(auth_session_id.value, secret)

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
      |> wisp.set_cookie(req, cookie.password_reset().name, "", wisp.Signed, 0)
      |> wisp.set_cookie(
        req,
        name: cookie.auth_session().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.auth_session().max_age,
      )
    }

    Error(ResetPasswordValidation(form)) ->
      form
      |> password_reset_session_view.set_new_password_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(ResetPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      password_reset_session_schema.set_new_password()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> password_reset_session_view.set_new_password_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
