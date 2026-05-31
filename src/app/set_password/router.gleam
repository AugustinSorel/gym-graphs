import app/crypto
import app/ctx.{type Ctx}
import app/set_password/repo
import app/set_password/ui
import app/verify_email_address/repo as verify_email_address_repo
import app/web
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request}

pub fn view_set_password_page(req: Request, ctx: Ctx) {
  // use session <- require_verified_sign_up_session(req, ctx)

  let email_address = "hello@google.com"

  ui.get_set_password_form()
  // |> form.add_string("email_address", session.email_address)
  |> form.add_string("email_address", email_address)
  |> ui.set_password_form()
  |> ui.set_password_page()
  |> web.html(200)
}

pub fn set_password(req: Request, ctx: Ctx) {
  // use formdata <- wisp.require_form(req)

  // let candidate_form =
  //   ui.get_set_password_form()
  //   |> form.add_values(formdata.values)

  // let parsed_form =
  //   candidate_form
  //   |> form.run()
  //   |> result.map_error(fn(form) {
  //     form
  //     |> ui.set_password_form()
  //     |> ui.set_password_page
  //     |> web.html(422)
  //   })

  // use form <- web.require_ok(parsed_form)

  // use session <- require_verified_sign_up_session(req, ctx)

  // use <- bool.guard(
  //   when: form.password != form.password_confirm,
  //   return: candidate_form
  //     |> form.add_error(
  //       "password_confirm",
  //       form.CustomError("passwords do not match"),
  //     )
  //     |> form.add_string("email_address", session.email_address)
  //     |> ui.set_password_form()
  //     |> ui.set_password_page()
  //     |> web.html(422),
  // )

  // let salt = crypto.generate_session_secret()
  // let password_hash =
  //   crypto.hash_session_secret(
  //     bit_array.append(salt, bit_array.from_string(form.password)),
  //   )

  // let created_user =
  //   repo.create_user(ctx.db, session.email_address, password_hash, salt)
  //   |> result.map_error(fn(_) {
  //     candidate_form
  //     |> form.add_error("root", form.CustomError("something went wrong"))
  //     |> form.add_string("email_address", session.email_address)
  //     |> ui.set_password_form()
  //     |> ui.set_password_page()
  //     |> web.html(500)
  //   })

  // use _ <- web.require_ok(created_user)

  // let _ =
  //   verify_email_address_repo.delete_sign_up_session_by_id(ctx.db, session.id)

  // wisp.ok()
  // |> clear_cookie(req)
  // |> wisp.set_header("HX-Redirect", "/")

  todo
}
// fn parse_sign_up_session_token(req: Request) -> Result(#(Int, BitArray), Nil) {
//   let candidate_token =
//     wisp.get_cookie(req, "sign_up_session_token", wisp.Signed)

//   use candidate_token <- result.try(candidate_token)

//   let candidate_token = case string.split(candidate_token, on: ".") {
//     [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
//     _ -> Error(Nil)
//   }

//   use #(raw_id, raw_secret) <- result.try(candidate_token)

//   use candidate_id <- result.try(int.parse(raw_id))
//   use candidate_secret <- result.map(bit_array.base64_decode(raw_secret))

//   #(candidate_id, candidate_secret)
// }

// fn require_verified_sign_up_session(req: Request, ctx: Ctx, next) {
//   let candidate_token =
//     parse_sign_up_session_token(req)
//     |> result.replace_error(wisp.redirect("/sign-up") |> clear_cookie(req))

//   use candidate_token <- web.require_ok(candidate_token)

//   let #(candidate_session_id, candidate_session_secret) = candidate_token

//   let session =
//     verify_email_address_repo.select_by_id(ctx.db, candidate_session_id)

//   let session = case session {
//     Ok(session) -> Ok(session)
//     Error(verify_email_address_repo.NotFound) ->
//       ui.get_set_password_form()
//       |> form.add_error("root", form.CustomError("Invalid or expired token"))
//       |> ui.set_password_form()
//       |> ui.set_password_page()
//       |> web.html(401)
//       |> clear_cookie(req)
//       |> Error
//     Error(verify_email_address_repo.Database) ->
//       ui.get_set_password_form()
//       |> form.add_error("root", form.CustomError("Something went wrong"))
//       |> ui.set_password_form()
//       |> ui.set_password_page()
//       |> web.html(500)
//       |> Error
//   }

//   use session <- web.require_ok(session)

//   let is_secret_valid =
//     candidate_session_secret
//     |> crypto.hash_session_secret()
//     |> crypto.validate_session_secret(session.secret_hash)

//   use <- bool.guard(
//     when: !is_secret_valid,
//     return: ui.get_set_password_form()
//       |> form.add_error("root", form.CustomError("invalid token"))
//       |> ui.set_password_form()
//       |> ui.set_password_page()
//       |> web.html(401)
//       |> clear_cookie(req),
//   )

//   use <- bool.guard(
//     when: option.is_none(session.email_address_verified_at),
//     return: wisp.redirect("/verify-email-address"),
//   )

//   next(session)
// }

// fn clear_cookie(res, req) {
//   wisp.set_cookie(
//     res,
//     req,
//     name: "sign_up_session_token",
//     value: "",
//     security: wisp.Signed,
//     max_age: 0,
//   )
// }
