import formal/form.{type Form}
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/session
import gym_graphs/domains/sign_up_session.{type SignUpSession}
import gym_graphs/domains/user
import gym_graphs/email_template
import gym_graphs/mailer.{type SendError}
import gym_graphs/repos/auth_session_repo
import gym_graphs/repos/sign_up_session_repo
import gym_graphs/repos/user_repo
import gym_graphs/schemas/sign_up_session_schema.{
  type SetPasswordSchema, type StartSchema, type VerifyEmailAddressSchema,
}
import gym_graphs/views/sign_up_session_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_start_page() {
  sign_up_session_schema.parse_start()
  |> sign_up_session_view.register_form()
  |> sign_up_session_view.register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

type StartError {
  StartValidationFailed(Form(StartSchema))
  EmailAlreadyUsed
  DatabaseFailure(QueryError)
  EmailFailure(SendError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)
    let code = sign_up_session.generate_email_verification_code()

    use sign_up_session <- result.try({
      sign_up_session_repo.create(ctx.db, input.email, secret_hash, code)
      |> result.map_error(DatabaseFailure)
      |> result.try(option.to_result(_, EmailAlreadyUsed))
    })

    let #(subject, html) = email_template.verification_code(code)

    use Nil <- result.try(
      mailer.send(ctx.mailer, mailer.new_config(input.email, subject, html))
      |> result.map_error(EmailFailure),
    )

    Ok(session.encode_token(sign_up_session.id.value, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> wisp.set_cookie(
        req,
        name: cookie.sign_up_session().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.sign_up_session().max_age,
      )

    Error(StartValidationFailed(form)) -> {
      form
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(EmailAlreadyUsed) -> {
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(409)
    }
    Error(DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
    Error(EmailFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.parse_start()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.register_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_email_page() {
  sign_up_session_schema.verify_email()
  |> sign_up_session_view.verify_email_form(option.None)
  |> sign_up_session_view.verify_email_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

type VerifyEmailError {
  VerifyEmailValidationFailed(Form(VerifyEmailAddressSchema))
  VerificationCodeFailed
  VerifyEmailDatabaseFailure(QueryError)
}

pub fn verify_email(req: Request, sign_up_session: SignUpSession, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_session_schema.verify_email()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyEmailValidationFailed),
    )

    let code = sign_up_session.email_address_verification_code

    use Nil <- result.try(
      sign_up_session.verify_email_code(code, input.code)
      |> result.replace_error(VerificationCodeFailed),
    )

    sign_up_session_repo.verify_by_id(ctx.db, sign_up_session.id)
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
      |> sign_up_session_view.verify_email_form(option.None)
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(VerificationCodeFailed) -> {
      sign_up_session_schema.verify_email()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> sign_up_session_view.verify_email_form(option.None)
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(VerifyEmailDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.verify_email()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.verify_email_form(option.None)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn resend(req: Request, sign_up_session: SignUpSession, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result = {
    let code = sign_up_session.email_address_verification_code
    let #(subject, html) = email_template.verification_code(code)

    let config = mailer.new_config(sign_up_session.email, subject, html)

    mailer.send(ctx.mailer, config)
  }

  case result {
    Ok(Nil) ->
      sign_up_session_schema.verify_email()
      |> form.add_values(form_data.values)
      |> sign_up_session_view.verify_email_form(option.Some(
        "A new verification code has been sent to your email address.",
      ))
      |> element.to_string()
      |> wisp.html_response(200)

    Error(error) -> {
      wisp.log_error("sign up: resend verify email: " <> string.inspect(error))
      sign_up_session_schema.verify_email()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.verify_email_form(option.None)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn cancel(req: Request, session: SignUpSession, ctx: Ctx) {
  let result = sign_up_session_repo.delete_by_id(ctx.db, session.id)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_cookie(
        req,
        name: cookie.sign_up_session().name,
        value: "",
        security: wisp.Signed,
        max_age: 0,
      )
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.verify_email()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> sign_up_session_view.verify_email_form(option.None)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_set_password_page(sign_up_session: SignUpSession) {
  sign_up_session_schema.get_set_password_form()
  |> form.add_string("email", sign_up_session.email.value)
  |> sign_up_session_view.set_password_form()
  |> sign_up_session_view.set_password_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

type SetPasswordError {
  SetPasswordValidation(Form(SetPasswordSchema))
  SetPasswordDatabaseFailure(QueryError)
  SetPasswordCreationFailed
}

pub fn set_password(req: Request, sign_up_session: SignUpSession, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      sign_up_session_schema.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SetPasswordValidation),
    )

    let name = user.new_name(sign_up_session.email)

    pog.transaction(ctx.db, fn(tx) {
      use user_id <- result.try({
        user_repo.create(tx, input.password_hash, name, sign_up_session.id)
        |> result.map_error(SetPasswordDatabaseFailure)
        |> result.try(option.to_result(_, SetPasswordCreationFailed))
      })

      use Nil <- result.try(
        sign_up_session_repo.delete_by_id(tx, sign_up_session.id)
        |> result.replace(Nil)
        |> result.map_error(SetPasswordDatabaseFailure),
      )

      //TODO: seed user account

      let secret = session.generate_secret()
      let secret_hash = session.hash_secret(secret)

      use auth_session_id <- result.try(
        auth_session_repo.create(tx, user_id, secret_hash)
        |> result.map_error(SetPasswordDatabaseFailure)
        |> result.try(option.to_result(_, SetPasswordCreationFailed)),
      )

      let token = session.encode_token(auth_session_id, secret)

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
      |> wisp.set_cookie(
        req,
        name: cookie.sign_up_session().name,
        value: "",
        security: wisp.Signed,
        max_age: 0,
      )
      |> wisp.set_cookie(
        req,
        name: cookie.auth_session().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.auth_session().max_age,
      )
    }
    Error(SetPasswordValidation(form)) ->
      form
      |> sign_up_session_view.set_password_form()
      |> element.to_string()
      |> wisp.html_response(422)
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      sign_up_session_schema.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> sign_up_session_view.set_password_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
