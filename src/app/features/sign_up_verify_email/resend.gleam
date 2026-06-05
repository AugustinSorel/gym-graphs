import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/domain/sign_up_session/sign_up_session
import app/features/sign_up_verify_email/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import wisp.{type Request}

type ResendError {
  AlreadyVerified
}

pub fn resend(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    Ok(session)
  }

  case result {
    Ok(session) -> {
      echo session.email_address_verification_code

      // TODO: send verification email with session.email_address_verification_code
      ui.get_form()
      |> form.add_values(form_data.values)
      |> form.add_string(
        "success_msg",
        "A new verification code has been sent to your email address.",
      )
      |> ui.form()
      |> web.html(200)
    }

    Error(AlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-up/set-password")
  }
}
