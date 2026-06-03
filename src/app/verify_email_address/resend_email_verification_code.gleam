import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import wisp.{type Request}

type ResendError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
  AlreadyVerified
}

pub fn resend(req: Request, ctx: Ctx) {
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

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    Ok(session)
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

    Error(InvalidSignUpSessionCookie) | Error(InvalidSignUpSessionToken) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(AlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/set-password")
  }
}
