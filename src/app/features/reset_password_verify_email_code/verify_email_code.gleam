import app/crypto
import app/ctx.{type Ctx}
import app/domain/password_reset_session/password_reset_session
import app/domain/password_reset_session/sql as password_reset_session_sql
import app/features/reset_password_verify_email_code/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import pog
import wisp.{type Request}

type VerifyError {
  Validation(form: form.Form(ui.VerifyEmailCodeForm))
  AlreadyVerified
  IncorrectCode
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
  UserNotFound
}

pub fn verify(req: Request, ctx: Ctx) {
  use session <- password_reset_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let is_verified = option.is_some(session.user_identity_verified_at)

    use <- bool.guard(when: is_verified, return: Error(AlreadyVerified))

    let email_code_hash =
      crypto.hash_password_reset_email_code(input.code, session.email_code_salt)

    let code_correct =
      crypto.validate_session_secret(
        session.email_code_hash,
        email_code_hash.raw_hash,
      )

    use <- bool.guard(when: !code_correct, return: Error(IncorrectCode))

    mark_verified(ctx, session.id)
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(AlreadyVerified) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/reset-password/set-new-password")

    Error(Validation(form:)) -> {
      let email = get_email(ctx, session.id)
      form
      |> ui.form(email)
      |> web.html(422)
    }

    Error(IncorrectCode) -> {
      let email = get_email(ctx, session.id)
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError(
          "The verification code you entered is incorrect. Please try again.",
        ),
      )
      |> ui.form(email)
      |> web.html(422)
    }

    Error(DatabaseFailure(_))
    | Error(UnexpectedDatabaseResult)
    | Error(UserNotFound) -> {
      ui.get_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.form("")
      |> web.html(500)
    }
  }
}

fn mark_verified(ctx: Ctx, session_id: Int) {
  password_reset_session_sql.set_user_identity_verified_at_to_now(
    ctx.db,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}
