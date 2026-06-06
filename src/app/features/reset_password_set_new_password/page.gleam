import app/ctx.{type Ctx}
import app/domain/password_reset_session/password_reset_session
import app/domain/password_reset_session/sql
import app/features/reset_password_set_new_password/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog.{type Connection}
import wisp.{type Request, type Response}

type ViewPageError {
  NotVerified
  DatabaseFailure(pog.QueryError)
  UserNotFound
}

pub fn view(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      ui.get_form()
      |> form.add_string("email_address", user.email_address)
      |> ui.form()
      |> ui.page()
      |> web.html(200)

    Error(NotVerified) ->
      wisp.redirect("/reset-password/verify-email-code")

    Error(DatabaseFailure(_)) | Error(UserNotFound) ->
      ui.get_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.form()
      |> ui.page()
      |> web.html(500)
  }
}

fn select_user(db: Connection, session_id: Int) {
  sql.select_user_by_password_reset_session_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UserNotFound)
    }
  })
}
