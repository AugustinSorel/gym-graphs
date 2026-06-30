import app/account_deletion/account_deletion
import app/account_deletion/ui.{type VerifyPasswordForm}
import app/auth_session/handler
import app/crypto
import app/ctx.{type Ctx}
import app/db
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
import wisp.{type Request, type Response}

fn require(req: Request, ctx: Ctx, next) -> Response {
  let result = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    use session <- result.try(
      account_deletion.select_by_id(ctx.db, token.id)
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
      wisp.redirect("/") |> session.clear_cookie(req, cookie_name)
    }
  }
}

fn require_unverified(req: Request, ctx: Ctx, next) -> Response {
  use auth_session, user <- handler.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/") |> session.clear_cookie(req, cookie_name),
  )

  let already_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/delete-account/confirm"),
  )

  next(session, user)
}

fn require_verified(req: Request, ctx: Ctx, next) -> Response {
  use auth_session, user <- handler.require(req, ctx)
  use session <- require(req, ctx)

  let session_matched = auth_session.id == session.auth_session_id
  use <- bool.guard(
    when: !session_matched,
    return: wisp.redirect("/") |> session.clear_cookie(req, cookie_name),
  )

  let is_verified = option.is_some(session.user_identity_verified_at)
  use <- bool.guard(
    when: !is_verified,
    return: wisp.redirect("/delete-account/verify-password"),
  )

  next(session, user)
}

const cookie_name = "account_deletion_session_token"

fn cookie_max_age() {
  duration.hours(1) |> duration.to_seconds() |> float.round()
}

pub fn start(req: Request, ctx: Ctx) -> Response {
  use auth_session, _user <- handler.require(req, ctx)

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
      |> session.set_cookie(req, cookie_name, token, cookie_max_age())

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.remove_account_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }
    Error(db.RowNotFound) -> {
      wisp.log_error(req.path <> ": unexpected empty result creating session")
      ui.remove_account_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }
  }
}

pub fn view_verify_password_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- require_unverified(req, ctx)

  let result = user.select_by_id(ctx.db, user.id)

  case result {
    Ok(user) ->
      ui.get_verify_password_form()
      |> form.add_values([#("email", user.email_address)])
      |> ui.verify_password_form()
      |> ui.verify_password_page()
      |> web.html(200)

    Error(db.RowNotFound) -> {
      ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("user not found"))
      |> ui.verify_password_form()
      |> ui.verify_password_page()
      |> web.html(404)
    }
    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_password_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_password_form()
      |> ui.verify_password_page()
      |> web.html(500)
    }
  }
}

type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordForm))
  SelectingUserFailed(db.DatabaseError)
  MarkSessionAsVerifiedFailed(db.DatabaseError)
  InvalidCredentials
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

    use user <- result.try(
      user.select_by_id(ctx.db, user.id)
      |> result.map_error(SelectingUserFailed),
    )

    let is_password_correct =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(
      when: !is_password_correct,
      return: Error(InvalidCredentials),
    )

    use Nil <- result.try(
      account_deletion.mark_session_as_verified(ctx.db, session.id)
      |> result.map_error(MarkSessionAsVerifiedFailed)
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
      |> web.html(422)

    Error(SelectingUserFailed(db.RowNotFound)) -> {
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("User not found"))
      |> ui.verify_password_form()
      |> web.html(404)
    }
    Error(SelectingUserFailed(db.DatabaseFailure(error)))
    | Error(MarkSessionAsVerifiedFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.verify_password_form()
      |> web.html(500)
    }
    Error(InvalidCredentials) -> {
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> ui.verify_password_form()
      |> web.html(422)
    }
    Error(MarkSessionAsVerifiedFailed(db.RowNotFound)) -> {
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("Session not found"))
      |> ui.verify_password_form()
      |> web.html(404)
    }
  }
}

pub fn view_confirm_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- require_verified(req, ctx)

  ui.get_account_deletion_form()
  |> ui.confirm_form()
  |> ui.confirm_page()
  |> web.html(200)
}

pub fn confirm(req: Request, ctx: Ctx) -> Response {
  use session, _user <- require_verified(req, ctx)

  let result =
    user.delete_by_account_deletion_id(ctx.db, session.id)
    |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, cookie_name)
      |> session.clear_cookie(req, handler.cookie_name)
      |> wisp.set_header("HX-Redirect", "/sign-in")

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_account_deletion_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.confirm_form()
      |> web.html(500)
    }

    Error(db.RowNotFound) -> {
      ui.get_account_deletion_form()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.confirm_form()
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
    return: wisp.redirect("/") |> session.clear_cookie(req, cookie_name),
  )

  let result = {
    account_deletion.delete_by_id(ctx.db, session.id) |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> session.clear_cookie(req, cookie_name)
      |> wisp.set_header("HX-Redirect", "/")

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_password_form()
      |> web.html(500)
    }
    Error(db.RowNotFound) -> {
      ui.get_verify_password_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_password_form()
      |> web.html(500)
    }
  }
}
