import app/ctx.{type Ctx}
import formal/form.{type Form}
import gleam/result
import gleam/string
import identity/application/sign_up
import identity/presentation/cookie
import identity/presentation/session_cookie
import identity/presentation/sign_up/forms.{type EmailRegisterForm}
import identity/presentation/sign_up/ui
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_start_page() {
  forms.email_register()
  |> ui.email_register_form()
  |> ui.email_register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type StartError {
  StartValidationFailed(Form(EmailRegisterForm))
  StartDatabaseFailure(QueryError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.email_register()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    use token <- result.try(
      sign_up.create(
        ctx.user_repo(ctx),
        ctx.sign_up_session_repo(ctx),
        ctx.event_publisher(ctx),
        sign_up.CreateInput(email: input.email),
      )
      |> result.map_error(StartDatabaseFailure),
    )

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> session_cookie.set(req, cookie.sign_up_session(), token)

    Error(StartValidationFailed(form)) ->
      form
      |> ui.email_register_form()
      |> element.to_string
      |> wisp.html_response(422)

    Error(StartDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.email_register()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.email_register_form()
      |> element.to_string
      |> wisp.html_response(500)
    }
  }
}
