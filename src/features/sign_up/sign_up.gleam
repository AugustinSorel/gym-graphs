import app/ctx.{type Ctx}
import app/session
import app/web
import domains/sign_up_session/sign_up_session
import domains/user/user
import features/sign_up/ui
import formal/form
import gleam/float
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type QueryError}
import wisp.{type Request}

const cookie = "sign_up_session_token"

fn cookie_max_age() {
  duration.hours(24) |> duration.to_seconds() |> float.round()
}

pub fn view_start_page() {
  ui.get_register_form()
  |> ui.register_form()
  |> ui.register_page()
  |> web.send_html(200)
}

pub type StartError {
  StartValidationFailed(form.Form(ui.EmailRegisterForm))
  StartDatabaseFailure(QueryError)
}

pub fn start(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(StartValidationFailed),
    )

    use Nil <- result.try(
      user.check_if_email_is_available(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure),
    )

    use #(id, secret, _verification_code) <- result.try(
      sign_up_session.create(ctx.db, input.email)
      |> result.map_error(StartDatabaseFailure),
    )

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> session.set_cookie(req, cookie, token, cookie_max_age())
    }
    Error(StartValidationFailed(form)) -> {
      form
      |> ui.register_form()
      |> web.send_html(with_status: 422)
    }
    Error(StartDatabaseFailure(pog.ConstraintViolated(_, "users_email_key", _))) -> {
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> ui.register_form()
      |> web.send_html(with_status: 409)
    }
    Error(StartDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.register_form()
      |> web.send_html(with_status: 500)
    }
  }
}
