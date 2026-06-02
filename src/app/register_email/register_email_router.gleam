import app/ctx.{type Ctx}
import app/register_email/register_email
import app/register_email/register_email_error
import app/register_email/register_email_ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

//TODO: protect routes

pub fn view_page() {
  register_email_ui.get_form()
  |> register_email_ui.form()
  |> register_email_ui.page()
  |> web.html(200)
}

pub fn register_email(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let raw_input =
    register_email_ui.get_form()
    |> form.add_values(formdata.values)

  let result = {
    let input =
      raw_input
      |> form.run()
      |> result.map_error(register_email_error.Validation)

    use input <- result.try(input)

    let email_available = register_email.ensure_available(ctx.db, input)

    use _ <- result.try(email_available)

    let session = register_email.register(ctx.db, input.email)

    use session <- result.try(session)

    //TODO: send email code
    echo session.verification_code

    let token = sign_up_session_token.encode(session.id, session.secret)

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/verify-email-address")
      |> sign_up_session_cookie.set(req, token)

    Error(register_email_error.DuplicateEmail) -> {
      raw_input
      |> form.add_error("root", form.CustomError("Email address already taken"))
      |> register_email_ui.form()
      |> web.html(409)
    }
    Error(register_email_error.Validation(invalid_form:)) ->
      invalid_form
      |> register_email_ui.form()
      |> web.html(422)
    Error(register_email_error.DatabaseFailure(error:)) ->
      raw_input
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> register_email_ui.form()
      |> web.html(500)
    Error(register_email_error.UnexpectedDatabaseResult) ->
      raw_input
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> register_email_ui.form()
      |> web.html(500)
  }
}
