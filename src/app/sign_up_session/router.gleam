import app/database
import app/sign_up_session/ui
import app/user/sql as user_sql
import app/web.{type Context}
import formal/form
import gleam/list
import gleam/result
import wisp.{type Request}

pub fn view_create_sign_up_session_page() {
  ui.create_sign_up_session_page()
  |> web.html(200)
}

pub fn create_sign_up_session(req: Request, ctx: Context) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_sign_up_session_form()
    |> form.add_values(formdata.values)

  let parsed_form =
    candidate_form
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.create_sign_up_session_form
      |> web.html(wisp.unprocessable_content().status)
    })

  use form <- web.require_ok(parsed_form)

  let candidate_user =
    user_sql.select_by_email_address(ctx.db, form.email)
    |> result.map_error(fn(error) {
      let msg = database.query_error_to_string(error)

      candidate_form
      |> form.add_error("root", form.CustomError(msg))
      |> ui.create_sign_up_session_form()
      |> web.html(wisp.internal_server_error().status)
    })

  use rows <- web.require_ok(candidate_user)

  let user_not_taken = case rows.rows {
    [] -> Ok(Nil)
    _ ->
      candidate_form
      |> form.add_error("email", form.CustomError("Email already taken"))
      |> ui.create_sign_up_session_form()
      |> web.html(wisp.unprocessable_content().status)
      |> Error
  }

  use _ <- web.require_ok(user_not_taken)

  wisp.redirect(to: "/")
}
