import app/crypto
import app/ctx.{type Ctx}
import app/middleware/sign_up_session_guard
import app/verify_email_address/repo.{Database, NotFound}
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import wisp.{type Request}

//TODO: protect routes

pub fn view_verify_email_address_page(req: Request, ctx: Ctx) {
  use _ <- require_verified_sign_up_session(req, ctx)

  ui.get_verify_email_address_form()
  |> ui.verify_email_address_form()
  |> ui.verify_email_address_page()
  |> web.html(200)
}

pub fn verify_email_address(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_verify_email_address_form()
    |> form.add_values(formdata.values)

  let parsed_form =
    candidate_form
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.verify_email_address_form
      |> web.html(422)
    })

  use form <- web.require_ok(parsed_form)

  use session <- require_verified_sign_up_session(req, ctx)

  let verification_match =
    crypto.validate_verification_code(
      session.email_address_verification_code,
      form.code,
    )

  use <- bool.guard(
    when: !verification_match,
    return: candidate_form
      |> form.add_error("root", form.CustomError("invalid code"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401),
  )

  let session = repo.set_account_as_verified(ctx.db, session.id)

  let session = case session {
    Ok(session) -> Ok(session)
    Error(NotFound) -> {
      candidate_form
      |> form.add_error("root", form.CustomError("invalid code"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> Error
    }
    Error(Database) -> {
      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
      |> Error
    }
  }

  use _ <- web.require_ok(session)

  wisp.ok() |> wisp.set_header("HX-Redirect", "/set-password")
}

pub fn resend_verification_code(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_verify_email_address_form()
    |> form.add_values(formdata.values)

  use session <- require_verified_sign_up_session(req, ctx)

  //TODO: send verification with email
  echo session.email_address_verification_code

  candidate_form
  |> form.add_string(
    "success_message",
    "a new verification code has been sent to your email address",
  )
  |> ui.verify_email_address_form()
  |> web.html(200)
}

pub fn cancel_verify_email_address(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_verify_email_address_form()
    |> form.add_values(formdata.values)

  use session <- require_verified_sign_up_session(req, ctx)

  let deleted_session =
    repo.delete_sign_up_session_by_id(ctx.db, session.id)
    |> result.map_error(fn(_) {
      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
    })

  use _ <- web.require_ok(deleted_session)

  wisp.ok() |> clear_cookie(req) |> wisp.set_header("HX-Redirect", "/sign-up")
}

fn require_verified_sign_up_session(req, ctx, next) {
  let session = sign_up_session_guard.against_invalid(req, ctx)

  let session = case session {
    Ok(session) -> Ok(session)
    Error(sign_up_session_guard.MalformedToken) -> {
      wisp.redirect("/sign-up")
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.InvalidToken) -> {
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("invalid token"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.TokenNotFound) -> {
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("Invalid or expired token"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.Database) ->
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
      |> Error
  }

  use session <- web.require_ok(session)

  let already_verified = option.is_some(session.email_address_verified_at)

  use <- bool.guard(
    when: already_verified,
    return: wisp.redirect("/set-password"),
  )

  next(session)
}

fn clear_cookie(res, req) {
  wisp.set_cookie(
    res,
    req,
    name: "sign_up_session_token",
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}
