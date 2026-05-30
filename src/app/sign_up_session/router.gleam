import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/repo
import app/sign_up_session/ui
import app/user/repo as user_repo
import app/web
import formal/form
import gleam/bit_array
import gleam/int
import gleam/result
import wisp.{type Request}

pub fn view_create_sign_up_session_page() {
  ui.create_sign_up_session_page()
  |> web.html(200)
}

pub fn create_sign_up_session(req: Request, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_sign_up_session_form()
    |> form.add_values(formdata.values)

  let parsed_form =
    candidate_form
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.create_sign_up_session_form
      |> web.html(422)
    })

  use form <- web.require_ok(parsed_form)

  let candidate_user = user_repo.select_by_email_address(ctx.db, form.email)

  let candidate_user = case candidate_user {
    Ok(_) ->
      candidate_form
      |> form.add_error("email", form.CustomError("Email already taken"))
      |> ui.create_sign_up_session_form()
      |> web.html(409)
      |> Error
    Error(user_repo.UserNotFound) -> Ok(Nil)
    Error(user_repo.Database) -> {
      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.create_sign_up_session_form()
      |> web.html(500)
      |> Error
    }
  }

  use _ <- web.require_ok(candidate_user)

  let secret = crypto.generate_session_secret()
  let secret_hashed = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  let sign_up_session =
    repo.create_sign_up_session(
      ctx.db,
      secret_hashed,
      form.email,
      verification_code,
    )
    |> result.map_error(fn(_) {
      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.create_sign_up_session_form()
      |> web.html(500)
    })

  use session <- web.require_ok(sign_up_session)

  //TODO: send email code
  echo verification_code

  let encoded_secret = bit_array.base64_encode(secret, False)
  let session_token = int.to_string(session.id) <> "." <> encoded_secret

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/verify-email-address")
  |> wisp.set_cookie(
    req,
    name: "sign_up_session_token",
    value: session_token,
    security: wisp.Signed,
    max_age: 60 * 60 * 24,
  )
}
