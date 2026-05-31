import app/crypto
import app/ctx.{type Ctx}
import app/verify_email_address/repo.{Database, NotFound}
import app/verify_email_address/ui
import app/web
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request}

//TODO: protect routes

pub fn view_verify_email_address_page(req: Request, ctx: Ctx) {
  use _session <- require_sign_up_session(req, ctx)

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

  use session <- require_sign_up_session(req, ctx)

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

  use session <- require_sign_up_session(req, ctx)

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

  use session <- require_sign_up_session(req, ctx)

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

fn parse_sign_up_session_token(req: Request) -> Result(#(Int, BitArray), Nil) {
  let candidate_token =
    wisp.get_cookie(req, "sign_up_session_token", wisp.Signed)

  use candidate_token <- result.try(candidate_token)

  let candidate_token = case string.split(candidate_token, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(Nil)
  }

  use #(raw_id, raw_secret) <- result.try(candidate_token)

  use candidate_id <- result.try(int.parse(raw_id))
  use candidate_secret <- result.map(bit_array.base64_decode(raw_secret))

  #(candidate_id, candidate_secret)
}

fn require_sign_up_session(req: Request, ctx: Ctx, next) {
  let candidate_token =
    parse_sign_up_session_token(req)
    |> result.replace_error(wisp.redirect("/sign-up") |> clear_cookie(req))

  use candidate_token <- web.require_ok(candidate_token)

  let #(candidate_session_id, candidate_session_secret) = candidate_token

  let session = repo.select_by_id(ctx.db, candidate_session_id)

  let session = case session {
    Ok(session) -> Ok(session)
    Error(NotFound) ->
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("Invalid or expired token"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> clear_cookie(req)
      |> Error
    Error(Database) ->
      ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(500)
      |> Error
  }

  use session <- web.require_ok(session)

  let is_secret_valid =
    candidate_session_secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(
    when: !is_secret_valid,
    return: ui.get_verify_email_address_form()
      |> form.add_error("root", form.CustomError("invalid token"))
      |> ui.verify_email_address_form()
      |> ui.verify_email_address_page()
      |> web.html(401)
      |> clear_cookie(req),
  )

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
