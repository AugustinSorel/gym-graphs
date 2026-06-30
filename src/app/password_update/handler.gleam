import app/auth_session/handler
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/password_update/password_update
import app/password_update/ui
import app/session
import app/user/user
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import pog.{type QueryError}
import wisp.{type Request, type Response}

const cookie_name = "password_update_session_token"

fn cookie_max_age() {
  duration.hours(1) |> duration.to_seconds() |> float.round()
}

fn require(req, ctx: Ctx, next) {
  let result = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    use session <- result.try(
      password_update.select_by_id(ctx.db, token.id)
      |> result.replace_error(Nil),
    )

    use Nil <- result.try(
      session.validate_token(token, session.secret_hash)
      |> result.replace_error(Nil),
    )

    Ok(session)
  }

  case result {
    Ok(session) -> next(session)
    Error(Nil) -> {
      wisp.redirect("/account") |> session.clear_cookie(req, cookie_name)
    }
  }
}

fn require_unverified(req: Request, ctx: Ctx, next) -> Response {
  use auth_session, user <- handler.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> session.clear_cookie(req, cookie_name),
  )

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/update-password/set-new-password"),
  )

  next(session, user)
}

fn require_verified(req: Request, ctx: Ctx, next) -> Response {
  use auth_session, user <- handler.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> session.clear_cookie(req, cookie_name),
  )

  let is_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: !is_verified,
    return: wisp.redirect("/update-password/verify-password"),
  )

  next(session, user)
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- handler.require(req, ctx)

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
      |> session.set_cookie(req, cookie_name, token, cookie_max_age())

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.update_password_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }

    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> ": unexpected empty result creating session")
      ui.update_password_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }
  }
}

pub fn view_verify_password_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- require_unverified(req, ctx)

  ui.get_verify_password_form()
  |> form.add_values([#("email", user.email)])
  |> ui.verify_password_form()
  |> ui.verify_password_page()
  |> web.html(200)
}

type VerifyPasswordError {
  VerifyPasswordValidation(Form(ui.VerifyPasswordForm))
  SelectingUserFailed(db.DatabaseError)
  MarkSessionAsVerifiedFailed(db.DatabaseError)
  CredentialsError
}

pub fn verify_password(req: Request, ctx: Ctx) -> Response {
  use session, user <- require_unverified(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(VerifyPasswordValidation),
    )

    use db_user <- result.try(
      user.select_by_id(ctx.db, user.id)
      |> result.map_error(SelectingUserFailed),
    )

    let is_password_correct =
      crypto.validate_user_password(db_user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(CredentialsError),
    )

    use Nil <- result.try(
      password_update.mark_session_as_verified(ctx.db, session.id)
      |> result.map_error(MarkSessionAsVerifiedFailed)
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
      |> web.html(422)

    Error(CredentialsError) ->
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> ui.verify_password_form()
      |> web.html(422)

    Error(SelectingUserFailed(db.RowNotFound)) ->
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("User not found."))
      |> ui.verify_password_form()
      |> web.html(404)

    Error(SelectingUserFailed(db.DatabaseFailure(error)))
    | Error(MarkSessionAsVerifiedFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.verify_password_form()
      |> web.html(500)
    }

    Error(MarkSessionAsVerifiedFailed(db.RowNotFound)) ->
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Session not found."))
      |> ui.verify_password_form()
      |> web.html(404)
  }
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- require_verified(req, ctx)

  ui.get_set_new_password_form()
  |> form.add_values([#("email", user.email)])
  |> ui.set_new_password_form()
  |> ui.set_new_password_page()
  |> web.html(200)
}

type UpdatePasswordError {
  UpdatePasswordValidation(Form(ui.SetNewPasswordForm))
  UpdateUserPasswordFailed(db.DatabaseError)
  DeletePasswordUpdateSesssionFailed(db.DatabaseError)
  TransactionError(QueryError)
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session, _user <- require_verified(req, ctx)

  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdatePasswordValidation),
    )

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)

    pog.transaction(ctx.db, fn(tx) {
      use Nil <- result.try({
        user.update_password_by_password_update_id(
          tx,
          password_hash,
          salt,
          session.id,
        )
        |> result.map_error(UpdateUserPasswordFailed)
        |> result.replace(Nil)
      })

      use Nil <- result.try(
        password_update.delete_by_id(tx, session.id)
        |> result.map_error(DeletePasswordUpdateSesssionFailed)
        |> result.replace(Nil),
      )

      Ok(Nil)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(e) -> e
        pog.TransactionQueryError(err) -> TransactionError(err)
      }
    })
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> session.clear_cookie(req, cookie_name)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(UpdatePasswordValidation(form)) ->
      form
      |> ui.set_new_password_form()
      |> web.html(422)

    Error(UpdateUserPasswordFailed(db.DatabaseFailure(error)))
    | Error(DeletePasswordUpdateSesssionFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }

    Error(UpdateUserPasswordFailed(db.RowNotFound))
    | Error(DeletePasswordUpdateSesssionFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " unexpected database return")
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }

    Error(TransactionError(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }
  }
}

pub fn cancel(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- handler.require(req, ctx)
  use session <- require(req, ctx)

  use form_data <- wisp.require_form(req)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/account") |> session.clear_cookie(req, cookie_name),
  )

  let result = {
    password_update.delete_by_id(ctx.db, session.id) |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, cookie_name)
      |> wisp.set_header("HX-Redirect", "/account")

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }
    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> " unexpected database retrun")
      ui.get_set_new_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_new_password_form()
      |> web.html(500)
    }
  }
}
