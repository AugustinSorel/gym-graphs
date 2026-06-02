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
  InvalidCookie
  InvalidSession
  DatabaseFailure(pog.QueryError)
}

pub fn cancel(req: Request, ctx: Ctx) {
  let result = {
    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidCookie),
    )

    use session <- result.try(
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(InvalidSession),
    )

    cancel_email(ctx.db, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> sign_up_session_cookie.clear(req)
      |> wisp.set_header("HX-Redirect", "/sign-up")

    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(DatabaseFailure(_)) ->
      ui.get_verify_email_address_form()
      |> form.add_string("root", "Something went wrong, please try again.")
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
  }
}

fn cancel_email(db: Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.replace(Nil)
}
