import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql as sign_up_session_sql
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/result
import pog.{type Connection}
import wisp.{type Request}

type CancelError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
  DatabaseFailure(pog.QueryError)
}

pub fn cancel(req: Request, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result = {
    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidSignUpSessionCookie),
    )

    use session <- result.try(
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(InvalidSignUpSessionToken),
    )

    cancel_email(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> sign_up_session_cookie.clear(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(InvalidSignUpSessionCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSessionToken) ->
      ui.get_verify_email_address_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Your session has expired. Please sign up again."),
      )
      |> ui.verify_email_address_form()
      |> web.html(401)

    Error(DatabaseFailure(_)) ->
      ui.get_verify_email_address_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.verify_email_address_form()
      |> web.html(500)
  }
}

fn cancel_email(db: Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.replace(Nil)
}
