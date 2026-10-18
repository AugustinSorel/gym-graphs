import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/cookie
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/account_deletion_session.{type AccountDeletionSession}
import gym_graphs/domains/auth_session.{type AuthSession}
import gym_graphs/domains/session
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/account_deletion_session_repo
import gym_graphs/repos/user_repo
import gym_graphs/schemas/account_deletion_session_schema.{
  type VerifyPasswordSchema,
}
import gym_graphs/views/account_deletion_session_view
import gym_graphs/views/user_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn start(req: Request, auth_session: AuthSession, ctx: Ctx) {
  let result = {
    let secret = session.generate_secret()
    let secret_hash = session.hash_secret(secret)

    use account_deletion_session_id <- result.try(
      account_deletion_session_repo.create(ctx.db, auth_session.id, secret_hash),
    )

    Ok(session.encode_token(account_deletion_session_id, secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/verify-password")
      |> wisp.set_cookie(
        req,
        name: cookie.account_deletion().name,
        value: token.value,
        security: wisp.Signed,
        max_age: cookie.account_deletion().max_age,
      )
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_view.remove_account_row(error: option.Some("something went wrong"))
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_verify_password_page(user: User) {
  account_deletion_session_schema.verify_password()
  |> form.add_values([#("email", user.email.value)])
  |> account_deletion_session_view.verify_password_form()
  |> account_deletion_session_view.verify_password_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub type VerifyPasswordError {
  VerifyPasswordValidation(Form(VerifyPasswordSchema))
  VerifyPasswordDatabaseFailure(QueryError)
  InvalidCredentials
}

pub fn verify_password(
  req: Request,
  account_deletion_session: AccountDeletionSession,
  user: User,
  ctx: Ctx,
) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      account_deletion_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(VerifyPasswordValidation),
    )

    use <- bool.guard(
      when: !user.verify_password(user.password_hash, input.password),
      return: Error(InvalidCredentials),
    )

    account_deletion_session_repo.verify_by_id(
      ctx.db,
      account_deletion_session.id,
    )
    |> result.map_error(VerifyPasswordDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/delete-account/confirm")

    Error(VerifyPasswordValidation(form)) ->
      form
      |> account_deletion_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(InvalidCredentials) ->
      account_deletion_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Incorrect password."))
      |> account_deletion_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(VerifyPasswordDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_session_schema.verify_password()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> account_deletion_session_view.verify_password_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_confirm_page() {
  account_deletion_session_schema.confirm()
  |> account_deletion_session_view.confirm_form()
  |> account_deletion_session_view.confirm_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub fn confirm(
  req: Request,
  account_deletion_session: AccountDeletionSession,
  ctx: Ctx,
) {
  let result =
    user_repo.delete_by_account_deletion_session_id(
      ctx.db,
      account_deletion_session.id,
    )
    |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_cookie(
        req,
        cookie.account_deletion().name,
        "",
        wisp.Signed,
        0,
      )
      |> wisp.set_cookie(req, cookie.auth_session().name, "", wisp.Signed, 0)
      |> wisp.set_header("HX-Redirect", "/sign-in")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      account_deletion_session_schema.confirm()
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> account_deletion_session_view.confirm_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn cancel(
  req: Request,
  auth_session: AuthSession,
  account_deletion_session: AccountDeletionSession,
  ctx: Ctx,
) {
  use formdata <- wisp.require_form(req)

  use <- bool.guard(
    when: auth_session.id != account_deletion_session.auth_session_id,
    return: wisp.ok()
      |> wisp.set_cookie(
        req,
        cookie.account_deletion().name,
        "",
        wisp.Signed,
        0,
      )
      |> wisp.set_header("HX-Redirect", "/account"),
  )

  let result =
    account_deletion_session_repo.delete_by_id(
      ctx.db,
      account_deletion_session.id,
    )
    |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_cookie(
        req,
        cookie.account_deletion().name,
        "",
        wisp.Signed,
        0,
      )
      |> wisp.set_header("HX-Redirect", "/account")

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      case account_deletion_session.user_identity_verified_at {
        option.Some(_) ->
          account_deletion_session_schema.confirm()
          |> form.add_error("root", form.CustomError("Something went wrong."))
          |> account_deletion_session_view.confirm_form()
        option.None ->
          account_deletion_session_schema.verify_password()
          |> form.add_values(formdata.values)
          |> form.add_error("root", form.CustomError("Something went wrong."))
          |> account_deletion_session_view.verify_password_form()
      }
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
