import app/crypto
import app/ctx.{type Ctx}
import app/middleware/sign_up_session_guard
import app/set_password/repo
import app/set_password/ui
import app/user/repo as user_repo
import app/verify_email_address/repo as verify_email_address_repo
import app/verify_email_address/sql
import app/web
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/int
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
        repo.create_user(tx, password_hashed.raw_hash, salt, session.id)

      let user = case user {
        Ok(user) -> Ok(user)
        Error(repo.Database) -> {
          candidate_form
          |> form.add_error("root", form.CustomError("something went wrong"))
          |> ui.set_password_form()
          |> web.html(500)
          |> Error
        }
      }

      use user <- result.try(user)

      let session =
        verify_email_address_repo.delete_sign_up_session_by_id(tx, session.id)
        |> result.map_error(fn(err) {
          case err {
            verify_email_address_repo.NotFound
            | verify_email_address_repo.Database -> {
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
        repo.create_auth_session(tx, user.id, secret_hashed)
        |> result.map_error(fn(err) {
          case err {
            repo.Database -> {
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

  let encoded_secret = bit_array.base64_encode(secret, False)
  let session_token = int.to_string(auth_session.id) <> "." <> encoded_secret

  wisp.created()
  |> wisp.set_header("HX-Redirect", "/")
  |> clear_cookie(req)
  |> wisp.set_cookie(
    req,
    name: "auth_session_token",
    value: session_token,
    security: wisp.Signed,
    max_age: 60 * 60 * 24,
  )
}

fn require_verified_sign_up_session(
  req: Request,
  ctx: Ctx,
  next: fn(sql.SelectByIdRow) -> Response,
) -> Response {
  let session = sign_up_session_guard.against_invalid(req, ctx)

  let session = case session {
    Ok(session) -> Ok(session)
    Error(sign_up_session_guard.MalformedToken) -> {
      wisp.redirect("/sign-up")
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.InvalidToken) -> {
      ui.get_set_password_form()
      |> form.add_error("root", form.CustomError("invalid token"))
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(401)
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.TokenNotFound) -> {
      ui.get_set_password_form()
      |> form.add_error("root", form.CustomError("Invalid or expired token"))
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(401)
      |> clear_cookie(req)
      |> Error
    }
    Error(sign_up_session_guard.Database) ->
      ui.get_set_password_form()
      |> form.add_error("root", form.CustomError("Something went wrong"))
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(500)
      |> Error
  }

  use session <- web.require_ok(session)

  next(session)
}

fn clear_cookie(res: Response, req: Request) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: "sign_up_session_token",
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}
