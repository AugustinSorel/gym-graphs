import app/auth_session/auth_session_cookie
import app/auth_session/auth_session_token
import app/ctx.{type Ctx}
import app/sign_in/sign_in_ui
import app/web
import gleam/result
import wisp.{type Request}

type ViewSignInPageError {
  AlreadySignIn
  InvalidAuthSessionCookie
  InvalidAuthSessionToken
}

pub fn view_page(req: Request, ctx: Ctx) {
  let result = {
    use token <- result.try(
      auth_session_cookie.parse(req)
      |> result.try(auth_session_token.decode)
      |> result.replace_error(InvalidAuthSessionCookie),
    )

    use _ <- result.try(
      auth_session_token.verify(token, ctx)
      |> result.replace_error(InvalidAuthSessionToken),
    )

    Error(AlreadySignIn)
  }

  case result {
    Ok(_) | Error(InvalidAuthSessionCookie) | Error(InvalidAuthSessionToken) -> {
      sign_in_ui.get_form()
      |> sign_in_ui.form()
      |> sign_in_ui.page()
      |> web.html(200)
    }

    Error(AlreadySignIn) -> {
      wisp.redirect("/")
    }
  }
}
