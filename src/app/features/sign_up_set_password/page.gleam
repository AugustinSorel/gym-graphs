import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/domain/sign_up_session/sign_up_session
import app/features/sign_up_set_password/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import wisp.{type Request, type Response}

type ViewPageError {
  EmailNotVerified
}

pub fn view(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    Ok(session)
  }

  case result {
    Ok(session) ->
      ui.get_form()
      |> form.add_string("email_address", session.email_address)
      |> ui.form()
      |> ui.page()
      |> web.html(200)

    Error(EmailNotVerified) ->
      wisp.redirect("/sign-up/verify-email-address")
  }
}
