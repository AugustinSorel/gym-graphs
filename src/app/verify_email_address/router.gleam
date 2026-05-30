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
  let candidate_token =
    wisp.get_cookie(req, "sign_up_session_token", wisp.Signed)
    |> result.replace_error(wisp.redirect("/sign-up") |> clear_cookie(req))

  use candidate_token <- web.require_ok(candidate_token)

  let candidate_token =
    parse_session_token(candidate_token)
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

  ui.get_verify_email_address_form()
  |> ui.verify_email_address_form()
  |> ui.verify_email_address_page()
  |> web.html(200)
}

pub fn verify_email_address(_req: Request) {
  //TODO: validate the verification code
  wisp.ok()
}

pub fn resend_verification_code(_req: Request) {
  //TODO: resend the verification code email
  wisp.ok()
}

fn parse_session_token(token: String) -> Result(#(Int, BitArray), Nil) {
  case string.split(token, on: ".") {
    [raw_id, raw_secret] -> {
      use id <- result.try(int.parse(raw_id))
      use secret <- result.map(bit_array.base64_decode(raw_secret))
      #(id, secret)
    }
    _ -> Error(Nil)
  }
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
