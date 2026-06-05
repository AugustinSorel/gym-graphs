import app/ctx.{type Ctx}
import app/domain/auth_session/auth_session
import app/domain/sign_up_session/sign_up_session
import app/features/sign_up_verify_email/ui
import app/web
import gleam/bool
import gleam/option
import wisp.{type Request}

type ViewPageError {
  AlreadyVerified
}

pub fn view(req: Request, ctx: Ctx) {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)

  let result = {
    let already_verified = option.is_some(session.email_address_verified_at)

    use <- bool.guard(when: already_verified, return: Error(AlreadyVerified))

    Ok(session)
  }

  case result {
    Ok(_) ->
      ui.get_form()
      |> ui.form()
      |> ui.page()
      |> web.html(200)

    Error(AlreadyVerified) -> wisp.redirect("/sign-up/set-password")
  }
}
