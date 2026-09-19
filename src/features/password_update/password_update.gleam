import app/crypto
import app/ctx.{type Ctx}
import app/session
import app/web
import domains/auth_session/auth_session.{type AuthSession}
import domains/password_update/password_update.{type PasswordUpdateSession}
import domains/user/user.{type User}
import features/auth/auth
import features/password_update/forms.{
  type SetNewPasswordForm, type VerifyPasswordForm,
}
import features/password_update/ui
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
      password_update.create(ctx.db, auth_session.id)
    })

    Ok(session.encode_token(id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/verify-password")
      |> session.set_cookie(
        req,
        auth.password_update_cookie().name,
        token,
        auth.password_update_cookie().max_age,
      )

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_ui.update_password_row(error: option.Some("something went wrong"))
      |> web.send_html(500)
    }
  }
}

pub fn view_verify_password_page(user: User) {
  forms.get_verify_password_form()
  |> form.add_values([#("email", user.email_address)])
  |> ui.verify_password_form()
  |> ui.verify_password_page()
  |> web.send_html(200)
}

type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordForm))
  VerifyPasswordDatabaseFailure(QueryError)
  CredentialsError
}

pub fn verify_password(
  req: Request,
  password_update_session: PasswordUpdateSession,
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

    use db_user <- result.try(
      user.select_by_id(ctx.db, user.id)
      |> result.map_error(VerifyPasswordDatabaseFailure),
    )

    let is_password_correct =
      crypto.validate_user_password(db_user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(CredentialsError),
    )

    use Nil <- result.try(
      password_update.mark_session_as_verified(
        ctx.db,
        password_update_session.id,
      )
      |> result.map_error(VerifyPasswordDatabaseFailure)
      |> result.replace(Nil),
    )

    Ok(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/update-password/set-new-password")

    Error(VerifyPasswordValidation(invalid_form)) ->
      invalid_form
      |> ui.verify_password_form()
      |> web.send_html(422)

    Error(CredentialsError) ->
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> ui.verify_password_form()
      |> web.send_html(422)

    Error(VerifyPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_password_form()
      |> web.send_html(500)
    }
  }
}

pub fn view_set_new_password_page(user: User) {
  forms.get_set_new_password_form()
  |> form.add_values([#("email", user.email_address)])
  |> ui.set_new_password_form()
  |> ui.set_new_password_page()
  |> web.send_html(200)
}

type UpdatePasswordError {
  UpdatePasswordValidation(Form(SetNewPasswordForm))
  UpdatePasswordDatabaseFailure(QueryError)
}

pub fn set_new_password(
  req: Request,
  password_update_session: PasswordUpdateSession,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      forms.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdatePasswordValidation),
    )

    let password_hash = crypto.hash_user_password(input.password)

    pog.transaction(ctx.db, fn(tx) {
      use Nil <- result.try({
        user.update_password_by_password_update_id(
          tx,
          password_hash,
          password_update_session.id,
        )
        |> result.map_error(UpdatePasswordDatabaseFailure)
        |> result.replace(Nil)
      })

      use Nil <- result.try(
        password_update.delete_by_id(tx, password_update_session.id)
        |> result.map_error(UpdatePasswordDatabaseFailure)
        |> result.replace(Nil),
      )

      Ok(Nil)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> UpdatePasswordDatabaseFailure(err)
      }
    })
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> session.clear_cookie(req, auth.password_update_cookie().name)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(UpdatePasswordValidation(form)) ->
      form
      |> ui.set_new_password_form()
      |> web.send_html(422)

    Error(UpdatePasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.send_html(500)
    }
  }
}

pub fn cancel(
  req: Request,
  auth_session: AuthSession,
  password_update_session: PasswordUpdateSession,
  ctx: Ctx,
) {
  use form_data <- wisp.require_form(req)

  let session_matched =
    auth_session.id == password_update_session.auth_session_id

  use <- bool.guard(when: !session_matched, return: {
    wisp.redirect("/account")
    |> session.clear_cookie(req, auth.password_update_cookie().name)
  })

  let result = {
    password_update.delete_by_id(ctx.db, password_update_session.id)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, auth.password_update_cookie().name)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      forms.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.send_html(500)
    }
  }
}
