import app/crypto
import app/ctx.{type Ctx}
import app/register_email/ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/sign_up_session/sql
import app/user/sql as user_sql
import app/web
import formal/form
import gleam/result
import gleam/string
import pog
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

  let available_user =
    user_sql.select_user_by_email_address(ctx.db, form.email)
    |> result.map_error(fn(error) {
      { "selecting user by email failed: " <> string.inspect(error) }
      |> wisp.log_error()

      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.email_register_form()
      |> web.html(500)
    })
    |> result.try(fn(user) {
      case user {
        pog.Returned(_, []) -> {
          Ok(Nil)
        }
        pog.Returned(_, _) -> {
          candidate_form
          |> form.add_error("email", form.CustomError("Email already taken"))
          |> ui.email_register_form()
          |> web.html(409)
          |> Error
        }
      }
    })

  use _ <- web.require_ok(available_user)

  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  let sign_up_session =
    sql.create_sign_up_session(
      ctx.db,
      secret_hash,
      form.email,
      verification_code,
    )
    |> result.map_error(fn(error) {
      wisp.log_error("create sign up session failed: " <> string.inspect(error))

      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.email_register_form()
      |> web.html(500)
    })
    |> result.try(fn(session) {
      case session {
        pog.Returned(_, [session, ..]) -> Ok(session)
        pog.Returned(_, _) -> {
          { "unexpected returned by database in create sign up session" }
          |> wisp.log_error()

          candidate_form
          |> form.add_error("root", form.CustomError("something went wrong"))
          |> ui.email_register_form()
          |> web.html(500)
          |> Error
        }
      }
    })

  use session <- web.require_ok(sign_up_session)

  //TODO: send email code
  echo verification_code

  let token = sign_up_session_token.encode(session.id, secret)

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/verify-email-address")
  |> sign_up_session_cookie.set(req, token)
}
