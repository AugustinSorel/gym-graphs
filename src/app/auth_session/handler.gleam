import app/auth_session/auth_session
import app/auth_session/sql
import app/auth_session/ui
import app/crypto
import app/ctx.{type Ctx}
import app/db
import app/session
import app/user/sql as user_sql
import app/user/user
import app/web
import formal/form
import gleam/bool
import gleam/float
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import wisp.{type Request, type Response}

pub const cookie_name: String = "auth_session_token"

pub fn cookie_max_age() {
  duration.hours(24) |> duration.to_seconds() |> float.round()
}

pub fn require(req, ctx: Ctx, next) {
  let result = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    use session <- result.try(
      auth_session.select_by_id(ctx.db, token.id) |> result.replace_error(Nil),
    )

    use Nil <- result.try(session.validate_token(token, session.secret_hash))

    let auth_session = auth_session.AuthSession(id: session.id)

    let user =
      auth_session.User(
        id: session.user_id,
        name: session.name,
        email: session.email_address,
        created_at: session.user_created_at,
        weight_unit: case session.weight_unit {
          sql.Kg -> user_sql.Kg
          sql.Lbs -> user_sql.Lbs
        },
      )

    use Nil <- result.try(auth_session.refresh(session, ctx.db))

    Ok(#(auth_session, user, cookie))
  }

  case result {
    Ok(#(session, user, cookie)) ->
      next(session, user)
      |> session.set_cookie(req, cookie_name, cookie, cookie_max_age())
    Error(Nil) -> {
      wisp.redirect("/sign-up") |> session.clear_cookie(req, cookie_name)
    }
  }
}

pub fn require_blank(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let res = {
    use cookie <- result.try(session.get_cookie(req, cookie_name))
    use token <- result.try(session.decode_token(cookie))

    auth_session.select_by_id(ctx.db, token.id)
    |> result.replace_error(Nil)
    |> result.replace(Nil)
  }
  case res {
    Ok(Nil) -> wisp.redirect("/")
    Error(Nil) -> next()
  }
}

pub fn view_sign_in_page(req: Request, ctx: Ctx) -> Response {
  use <- require_blank(req, ctx)

  ui.get_sign_in_form()
  |> ui.sign_in_form()
  |> ui.sign_in_page()
  |> web.html(200)
}

type SignInError {
  SignInFormError(form.Form(ui.SignInForm))
  SelectingUserByEmailFailed(db.DatabaseError)
  CreatingUserFailed(db.DatabaseError)
  InvalidCredentials
}

pub fn sign_in(req: Request, ctx: Ctx) -> Response {
  use <- require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(SignInFormError),
    )

    use user <- result.try(
      user.select_by_email(ctx.db, input.email)
      |> result.map_error(SelectingUserByEmailFailed),
    )

    let password_valid =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    use #(session, secret) <- result.try(
      auth_session.create(ctx.db, user.id)
      |> result.map_error(CreatingUserFailed),
    )

    Ok(session.encode_token(session.id, secret))
  }

  case result {
    Ok(token) -> {
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> session.set_cookie(req, cookie_name, token, cookie_max_age())
    }

    Error(SignInFormError(form)) ->
      form
      |> ui.sign_in_form()
      |> web.html(422)

    Error(InvalidCredentials)
    | Error(SelectingUserByEmailFailed(db.RowNotFound)) ->
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> ui.sign_in_form()
      |> web.html(401)

    Error(SelectingUserByEmailFailed(db.DatabaseFailure(error)))
    | Error(CreatingUserFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.sign_in_form()
      |> web.html(500)
    }

    Error(CreatingUserFailed(db.RowNotFound)) -> {
      wisp.log_error(req.path <> " unexpected database return")
      ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.sign_in_form()
      |> web.html(500)
    }
  }
}

pub fn sign_out(req: Request, ctx: Ctx) -> Response {
  use session, _user <- require(req, ctx)

  let result =
    sql.delete_auth_session_by_id(ctx.db, session.id)
    |> result.replace(Nil)

  case result {
    Ok(Nil) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> session.clear_cookie(req, cookie_name)

    Error(err) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.sign_out_row(error: option.Some("something went wrong"))
      |> web.html(500)
    }
  }
}
