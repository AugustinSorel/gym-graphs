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
  InvalidCookie
  InvalidSession
  EmailNotVerified
}

pub fn view_page(req: Request, ctx: Ctx) -> Response {
  let result = {
    use token <- result.try(
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidCookie),
    )

    use session <- result.try(
      sign_up_session_token.verify(token, ctx)
      |> result.replace_error(InvalidSession),
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

    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      ui.get_set_password_form()
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
