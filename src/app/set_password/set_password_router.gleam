import app/auth_session/auth_session_cookie
import app/auth_session/auth_session_repo
import app/crypto
import app/ctx.{type Ctx}
import app/set_password/ui
import app/sign_up_session/sign_up_session_cookie
import app/sign_up_session/sign_up_session_repo
import app/sign_up_session/sign_up_session_token
import app/user/user_repo
import app/web
import formal/form
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import pog
import wisp.{type Request, type Response}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- require_verified_sign_up_session(req, ctx)

  let verified = option.is_some(session.email_address_verified_at)

  use <- bool.guard(when: !verified, return: wisp.redirect(to: "/sign-up"))

  ui.get_set_password_form()
  |> form.add_string("email_address", session.email_address)
  |> ui.set_password_form()
  |> ui.set_password_page()
  |> web.html(200)
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_set_password_form()
    |> form.add_values(formdata.values)

  let parsed_form =
    candidate_form
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.set_password_form()
      |> ui.set_password_page
      |> web.html(422)
    })

  use form <- web.require_ok(parsed_form)

  use session <- require_verified_sign_up_session(req, ctx)

  let verified = option.is_some(session.email_address_verified_at)

  use <- bool.guard(when: !verified, return: wisp.redirect(to: "/sign-up"))

  let candidate_user =
    user_repo.select_by_email_address(ctx.db, session.email_address)

  let candidate_user = case candidate_user {
    Ok(_) ->
      candidate_form
      |> form.add_error("root", form.CustomError("Email already taken"))
      |> ui.set_password_form()
      |> web.html(409)
      |> Error
    Error(user_repo.UserNotFound) -> Ok(Nil)
    Error(user_repo.Database) -> {
      candidate_form
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.set_password_form()
      |> web.html(500)
      |> Error
    }
  }

  use _ <- web.require_ok(candidate_user)

  let salt = crypto.generate_hashing_salt()
  let password_hashed = crypto.hash_user_password(form.password, salt)

  let secret = crypto.generate_session_secret()
  let secret_hashed = crypto.hash_session_secret(secret)

  let auth_session =
    pog.transaction(ctx.db, fn(tx) {
      let user =
        user_repo.create(tx, password_hashed.raw_hash, salt, session.id)
        |> result.map_error(fn(err) {
          case err {
            user_repo.Database | user_repo.UserNotFound ->
              candidate_form
              |> form.add_error(
                "root",
                form.CustomError("something went wrong"),
              )
              |> ui.set_password_form()
              |> web.html(500)
          }
        })

      use user <- result.try(user)

      let session =
        sign_up_session_repo.delete_by_id(tx, session.id)
        |> result.map_error(fn(err) {
          case err {
            sign_up_session_repo.NotFound | sign_up_session_repo.Database -> {
              candidate_form
              |> form.add_error(
                "root",
                form.CustomError("something went wrong"),
              )
              |> ui.set_password_form()
              |> web.html(500)
            }
          }
        })

      use _ <- result.try(session)

      let auth_session =
        auth_session_repo.create(tx, user.id, secret_hashed)
        |> result.map_error(fn(err) {
          case err {
            auth_session_repo.Database -> {
              candidate_form
              |> form.add_error(
                "root",
                form.CustomError("something went wrong"),
              )
              |> ui.set_password_form()
              |> web.html(500)
            }
          }
        })

      use auth_session <- result.try(auth_session)

      Ok(auth_session)
    })
    |> result.map_error(fn(err) {
      case err {
        pog.TransactionRolledBack(res) -> res
        pog.TransactionQueryError(err) -> {
          wisp.log_error("rollback error" <> string.inspect(err))

          candidate_form
          |> form.add_error("root", form.CustomError("something went wrong"))
          |> ui.set_password_form()
          |> web.html(500)
        }
      }
    })

  use auth_session <- web.require_ok(auth_session)

  let token = auth_session_cookie.encode(auth_session.id, secret)

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/")
  |> sign_up_session_cookie.clear(req)
  |> auth_session_cookie.set(req, token)
}

fn require_verified_sign_up_session(req: Request, ctx: Ctx, next) -> Response {
  let token =
    sign_up_session_cookie.parse(req)
    |> result.try(sign_up_session_token.decode)
    |> result.replace_error(
      wisp.redirect("/sign-up") |> sign_up_session_cookie.clear(req),
    )

  use token <- web.require_ok(token)

  let session =
    sign_up_session_token.verify(token, ctx)
    |> result.map_error(fn(err) {
      case err {
        sign_up_session_token.InvalidToken -> {
          ui.get_set_password_form()
          |> form.add_error("root", form.CustomError("invalid token"))
          |> ui.set_password_form()
          |> ui.set_password_page()
          |> web.html(401)
          |> sign_up_session_cookie.clear(req)
        }
        sign_up_session_token.TokenNotFound -> {
          ui.get_set_password_form()
          |> form.add_error(
            "root",
            form.CustomError("Invalid or expired token"),
          )
          |> ui.set_password_form()
          |> ui.set_password_page()
          |> web.html(401)
          |> sign_up_session_cookie.clear(req)
        }
        sign_up_session_token.Database ->
          ui.get_set_password_form()
          |> form.add_error("root", form.CustomError("Something went wrong"))
          |> ui.set_password_form()
          |> ui.set_password_page()
          |> web.html(500)
      }
    })

  use session <- web.require_ok(session)

  next(session)
}
