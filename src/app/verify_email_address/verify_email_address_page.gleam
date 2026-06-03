import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_token
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

type ViewPageError {
  InvalidSignUpSessionCookie
  InvalidSignUpSessionToken
}

pub fn view_page(req: Request, ctx: Ctx) {
  let result = {
    let token = {
      sign_up_session_cookie.parse(req)
      |> result.try(sign_up_session_token.decode)
      |> result.replace_error(InvalidSignUpSessionCookie)
    }

    use token <- result.try(token)

    sign_up_session_token.verify(token, ctx)
    |> result.replace_error(InvalidSignUpSessionToken)
  }

  case result {
    Ok(_) ->
      ui.get_verify_email_address_form()
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(200)

    Error(InvalidSignUpSessionCookie) ->
      wisp.redirect("/sign-up")
      |> sign_up_session_cookie.clear(req)

    Error(InvalidSignUpSessionToken) ->
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("the token is not valid"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> sign_up_session_cookie.clear(req)
  }
}
