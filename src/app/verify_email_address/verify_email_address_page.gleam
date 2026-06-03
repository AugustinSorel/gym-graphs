import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import gleam/bool
import gleam/option
import gleam/result
import wisp.{type Request}

type ViewPageError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
  AlreadyVerified
}

pub fn view_page(req: Request, ctx: Ctx) {
  let result = {
    let token = {
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidSignUpSessionCookie)
    }

    use token <- result.try(token)

    use session <- result.try(
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(InvalidSignUpSessionToken),
    )

    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    Ok(session)
  }

  case result {
    Ok(_) ->
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(200)

    Error(InvalidSignUpSessionCookie) | Error(InvalidSignUpSessionToken) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(AlreadyVerified) -> wisp.redirect("/set-password")
  }
}
