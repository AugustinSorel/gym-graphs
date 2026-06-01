import app/ctx.{type Ctx}
import app/register_email/register_email
import app/register_email/ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

//TODO: protect routes

pub fn view_page() {
  ui.get_register_email_form()
  |> ui.email_register_form()
  |> ui.email_register_page()
  |> web.html(200)
}

pub fn register_email(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_register_email_form()
    |> form.add_values(formdata.values)

  let parsed_form =
    candidate_form
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.email_register_form
      |> web.html(422)
    })

  use form <- web.require_ok(parsed_form)

  let session =
    register_email.register(ctx.db, form.email)
    |> result.map_error(register_error_response(candidate_form, _))

  use session <- web.require_ok(session)

  //TODO: send email code
  echo session.verification_code

  let token = sign_up_session_token.encode(session.id, session.secret)

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/verify-email-address")
  |> sign_up_session_cookie.set(req, token)
}

fn register_error_response(form, err) {
  case err {
    register_email.EmailAlreadyTaken ->
      form
      |> form.add_error("email", form.CustomError("Email already taken"))
      |> ui.email_register_form()
      |> web.html(409)

    register_email.DatabaseError(_) | register_email.UnexpectedDatabaseResult ->
      form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.email_register_form()
      |> web.html(500)
  }
}
