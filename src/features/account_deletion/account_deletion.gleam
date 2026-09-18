import app/crypto
import app/ctx.{type Ctx}
import app/session
import app/web
import domains/account_deletion/account_deletion.{type AccountDeletionSession}
import domains/auth_session/auth_session.{type AuthSession}
import domains/user/user.{type User}
import features/account_deletion/forms.{type VerifyPasswordForm}
import features/account_deletion/ui
import features/auth/auth
import features/user/ui as user_ui
import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request}

pub fn start(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    use #(id, secret) <- result.try({
      account_deletion.create(ctx.db, auth_session.id)
    })

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> session.set_cookie(
        req,
        auth.account_deletion_cookie().name,
        token,
        auth.account_deletion_cookie().max_age,
      )

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_ui.remove_account_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}

pub fn view_verify_password_page(req: Request, user: User, ctx: Ctx) {
  let result = user.select_by_id(ctx.db, user.id)

  case result {
    Ok(user) ->
      forms.get_verify_password_form()
      |> form.add_values([#("email", user.email_address)])
      |> ui.verify_password_form()
      |> ui.verify_password_page()
      |> web.send_html(200)

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_password_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_password_form()
      |> ui.verify_password_page()
      |> web.send_html(500)
    }
  }
}

type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordForm))
  VerifyPasswordDatabaseFailure(QueryError)
  InvalidCredentials
}

pub fn verify_password(
  req: Request,
  account_deletion_session: AccountDeletionSession,
  user: User,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(VerifyPasswordValidation),
    )

    use user <- result.try(
      user.select_by_id(ctx.db, user.id)
      |> result.map_error(VerifyPasswordDatabaseFailure),
    )

    let is_password_correct =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(InvalidCredentials),
    )

    use Nil <- result.try(
      account_deletion.mark_session_as_verified(
        ctx.db,
        account_deletion_session.id,
      )
      |> result.map_error(VerifyPasswordDatabaseFailure)
      |> result.replace(Nil),
    )

    Ok(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/confirm")

    Error(VerifyPasswordValidation(form)) ->
      form
      |> ui.verify_password_form()
      |> web.send_html(422)

    Error(InvalidCredentials) -> {
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> ui.verify_password_form()
      |> web.send_html(422)
    }

    Error(VerifyPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.verify_password_form()
      |> web.send_html(500)
    }
  }
}

pub fn view_confirm_page() {
  forms.get_account_deletion_form()
  |> ui.confirm_form()
  |> ui.confirm_page()
  |> web.send_html(200)
}

pub fn confirm(
  req: Request,
  account_deletion_session: AccountDeletionSession,
  ctx: Ctx,
) {
  let result =
    user.delete_by_account_deletion_id(ctx.db, account_deletion_session.id)
    |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, auth.account_deletion_cookie().name)
      |> session.clear_cookie(req, auth.auth_session_cookie().name)
      |> wisp.set_header("HX-Redirect", "/sign-in")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_account_deletion_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.confirm_form()
      |> web.send_html(500)
    }
  }
}

pub fn cancel(
  req: Request,
  auth_session: AuthSession,
  account_deletion_session: AccountDeletionSession,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let session_matched =
    auth_session.id == account_deletion_session.auth_session_id
  use <- bool.guard(when: !session_matched, return: {
    wisp.redirect("/")
    |> session.clear_cookie(req, auth.account_deletion_cookie().name)
  })

  let result = {
    account_deletion.delete_by_id(ctx.db, account_deletion_session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, auth.account_deletion_cookie().name)
      |> wisp.set_header("HX-Redirect", "/")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_password_form()
      |> web.send_html(500)
    }
  }
}
