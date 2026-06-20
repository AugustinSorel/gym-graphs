import app/auth_session/sql.{type SelectAuthSessionByIdRow} as auth_session_sql
import app/auth_session/ui as auth_session_ui
import app/crypto
import app/ctx.{type Ctx}
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form
import gleam/bit_array
import gleam/bool
import gleam/float
import gleam/int
import gleam/order
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import lustre/element/html
import pog.{type Connection}
import wisp.{type Request, type Response}

pub fn require(req: Request, ctx: Ctx, next) -> Response {
  let redirect = wisp.redirect("/sign-up") |> clear_cookie(req)

  let res = {
    use raw_token <- result.try(
      parse_cookie(req) |> result.replace_error(redirect),
    )

    use token <- result.try(
      decode_token(raw_token)
      |> result.replace_error(redirect),
    )

    use session <- result.try(
      verify_token(token, ctx)
      |> result.replace_error(redirect),
    )

    let response = next(session)

    refresh_auth_session(session, ctx.db)
    |> result.replace(response |> set_cookie(req, raw_token))
    |> result.replace_error(response)
  }

  case res {
    Ok(response) | Error(response) -> response
  }
}

pub fn require_blank(
  req: Request,
  ctx: Ctx,
  next: fn() -> Response,
) -> Response {
  let res =
    parse_cookie(req)
    |> result.try(decode_token)
    |> result.try(fn(token) {
      verify_token(token, ctx)
      |> result.map_error(fn(_) { Nil })
    })

  case res {
    Ok(_session) -> wisp.redirect("/")
    Error(_) -> next()
  }
}

const cookie_name = "auth_session_token"

pub fn set_cookie(res: Response, req: Request, value: String) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value:,
    security: wisp.Signed,
    max_age: duration.hours(24) |> duration.to_seconds() |> float.round(),
  )
}

pub fn clear_cookie(res: Response, req: Request) -> Response {
  wisp.set_cookie(
    res,
    req,
    name: cookie_name,
    value: "",
    security: wisp.Signed,
    max_age: 0,
  )
}

fn parse_cookie(req: Request) {
  wisp.get_cookie(req, name: cookie_name, security: wisp.Signed)
}

type AuthSessionToken {
  AuthSessionToken(id: Int, secret: BitArray)
}

pub fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}

fn decode_token(candidate_token: String) {
  let candidate_token = case string.split(candidate_token, on: ".") {
    [raw_id, raw_secret] -> Ok(#(raw_id, raw_secret))
    _ -> Error(Nil)
  }

  use #(raw_id, raw_secret) <- result.try(candidate_token)

  let candidate_id = raw_id |> int.parse()

  use id <- result.try(candidate_id)

  let candidate_secret = raw_secret |> bit_array.base64_decode()

  use secret <- result.map(candidate_secret)

  AuthSessionToken(id:, secret:)
}

type VerifyAuthSessionTokenError {
  InvalidToken
  ExpiredOrNotFound
}

fn verify_token(token: AuthSessionToken, ctx: Ctx) {
  use session <- result.try(
    auth_session_sql.select_auth_session_by_id(ctx.db, token.id)
    |> result.replace_error(InvalidToken),
  )

  use session <- result.try(case session {
    pog.Returned(_count, []) -> Error(ExpiredOrNotFound)
    pog.Returned(_count, [session, ..]) -> Ok(session)
  })

  let is_secret_valid =
    token.secret
    |> crypto.hash_session_secret()
    |> crypto.validate_session_secret(session.secret_hash)

  use <- bool.guard(when: !is_secret_valid, return: Error(InvalidToken))

  Ok(session)
}

fn refresh_auth_session(session: SelectAuthSessionByIdRow, db: Connection) {
  let elapsed_vs_threshold =
    timestamp.system_time()
    |> timestamp.difference(session.last_active_at)
    |> duration.compare(duration.hours(12))

  case elapsed_vs_threshold {
    order.Gt -> {
      auth_session_sql.update_auth_session_last_active_at(db, session.id)
      |> result.replace(Nil)
      |> result.replace_error(Nil)
    }
    order.Lt | order.Eq -> Error(Nil)
  }
}

type SignInError {
  Validation(form: form.Form(auth_session_ui.SignInForm))
  InvalidCredentials
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn view_sign_in_page(req: Request, ctx: Ctx) -> Response {
  use <- require_blank(req, ctx)

  auth_session_ui.get_sign_in_form()
  |> auth_session_ui.sign_in_form()
  |> auth_session_ui.sign_in_page()
  |> web.html(200)
}

pub fn sign_in(req: Request, ctx: Ctx) -> Response {
  use <- require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      auth_session_ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use user <- result.try(
      user_sql.select_user_by_email_address(ctx.db, input.email)
      |> result.map_error(DatabaseFailure)
      |> result.try(fn(returned) {
        case returned {
          pog.Returned(_, [user, ..]) -> Ok(user)
          pog.Returned(_, []) -> Error(InvalidCredentials)
        }
      }),
    )

    let password_valid =
      crypto.validate_user_password(user.password_hash, input.password)

    use <- bool.guard(when: !password_valid, return: Error(InvalidCredentials))

    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      auth_session_sql.create_auth_session(ctx.db, user.id, secret_hash)
      |> result.map_error(DatabaseFailure)
      |> result.try(fn(returned) {
        case returned {
          pog.Returned(_, [session, ..]) -> Ok(session)
          pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
        }
      }),
    )

    Ok(#(auth_session.id, secret))
  }

  case result {
    Ok(#(session_id, secret)) -> {
      let token = encode_token(session_id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> auth_session_ui.sign_in_form()
      |> web.html(422)

    Error(InvalidCredentials) ->
      auth_session_ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> auth_session_ui.sign_in_form()
      |> web.html(401)

    Error(DatabaseFailure(err)) -> {
      wisp.log_error("sign in database failure: " <> string.inspect(err))
      auth_session_ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> auth_session_ui.sign_in_form()
      |> web.html(500)
    }

    Error(UnexpectedDatabaseResult) -> {
      wisp.log_error("sign in: unexpected database result")
      auth_session_ui.get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> auth_session_ui.sign_in_form()
      |> web.html(500)
    }
  }
}

pub fn sign_out(req: Request, ctx: Ctx) -> Response {
  use session <- require(req, ctx)

  let result =
    auth_session_sql.delete_auth_session_by_id(ctx.db, session.id)
    |> result.map_error(DatabaseFailure)
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> clear_cookie(req)

    Error(_) -> {
      wisp.log_error(
        "sign out failed [session_id=" <> int.to_string(session.id) <> "]",
      )
      ui.alert([
        ui.alert_title(html.text("Something went wrong")),
        ui.alert_description(html.text("unexpected error")),
      ])
      |> web.html(500)
    }
  }
}
