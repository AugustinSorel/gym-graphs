import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

type ResendError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
}

pub fn resend(req: Request, ctx: Ctx) {
  use form_data <- wisp.require_form(req)

  let result = {
    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidSignUpSessionCookie),
    )

    sign_up_session_token.verify(token, ctx)
    |> result.replace_error(InvalidSignUpSessionToken)
  }

  case result {
    Ok(session) -> {
      echo session.email_address_verification_code

      // TODO: send verification email with _session.email_address_verification_code
      ui.get_verify_email_address_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> ui.verify_email_address_form()
      |> web.html(200)
    }
    Error(InvalidSignUpSessionCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSessionToken) ->
      ui.get_verify_email_address_form()
      |> form.add_values(form_data.values)
      |> form.add_string("root", "Invalid token")
      |> ui.verify_email_address_form()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
