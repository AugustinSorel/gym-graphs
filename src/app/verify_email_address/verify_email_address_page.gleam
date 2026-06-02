import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import gleam/result
import wisp.{type Request}

type ViewPageError {
  InvalidCookie
  InvalidSession
}

pub fn view_page(req: Request, ctx: Ctx) {
  let result = {
    let token = {
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidCookie)
    }

    use token <- result.try(token)

    sign_up_session_token.verify(token, ctx)
    |> result.replace_error(InvalidSession)
  }

  case result {
    Ok(_) ->
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(200)

    Error(InvalidCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSession) ->
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
