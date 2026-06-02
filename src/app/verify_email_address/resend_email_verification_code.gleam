import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

type ResendError {
  InvalidCookie
  InvalidSession
}

pub fn resend(req: Request, ctx: Ctx) {
  let result = {
    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidCookie),
    )

    sign_up_session_token.verify(token, ctx)
    |> result.replace_error(InvalidSession)
  }

  case result {
    Ok(session) -> {
      echo session.email_address_verification_code

      // TODO: send verification email with _session.email_address_verification_code
      ui.get_verify_email_address_form()
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> ui.verify_email_address_form()
      |> web.html(200)
    }
    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      ui.get_verify_email_address_form()
      |> form.add_string("root", "Session expired, please sign up again.")
      |> ui.verify_email_address_form()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
