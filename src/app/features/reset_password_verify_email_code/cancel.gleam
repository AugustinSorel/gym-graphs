import app/ctx.{type Ctx}
import app/domain/password_reset_session/password_reset_session
import app/domain/password_reset_session/password_reset_session_cookie
import app/domain/password_reset_session/sql as password_reset_session_sql
import app/features/reset_password_verify_email_code/ui
import app/web
import formal/form
import gleam/result
import pog
import wisp.{type Request}

type CancelError {
  DatabaseFailure(pog.QueryError)
}

pub fn cancel(req: Request, ctx: Ctx) {
  use session <- password_reset_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result =
    password_reset_session_sql.delete_password_reset_session_by_id(
      ctx.db,
      session.id,
    )
    |> result.map_error(DatabaseFailure)
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> password_reset_session_cookie.clear(req)
      |> wisp.set_header("HX-Redirect", "/reset-password")

    Error(DatabaseFailure(_)) -> {
      ui.get_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.form("")
      |> web.html(500)
    }
  }
}
