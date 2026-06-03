import app/ctx.{type Ctx}
import app/set_password/ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import wisp.{type Request, type Response}

type ViewPageError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
  EmailNotVerified
}

pub fn view_page(req: Request, ctx: Ctx) -> Response {
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

    use <- bool.guard(
      when: option.is_none(session.email_address_verified_at),
      return: Error(EmailNotVerified),
    )

    Ok(session)
  }

  case result {
    Ok(session) ->
      ui.get_set_password_form()
      |> form.add_string("email_address", session.email_address)
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(200)

    Error(EmailNotVerified) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSessionCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSessionToken) ->
      ui.get_set_password_form()
      |> form.add_error("root", form.CustomError("invalid token"))
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
