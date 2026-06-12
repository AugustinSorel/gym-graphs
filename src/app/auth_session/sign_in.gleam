import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import pog
import wisp.{type Request, type Response}

type SignInError {
  Validation(form: Form(SignInForm))
  InvalidCredentials
  DatabaseFailure(pog.QueryError)
  UnexpectedDatabaseResult
}

pub fn view_sign_in_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  get_sign_in_form()
  |> sign_in_form()
  |> sign_in_page()
  |> web.html(200)
}

pub fn sign_in(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_sign_in_form()
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
      let token = auth_session.encode_token(session_id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> sign_in_form()
      |> web.html(422)

    Error(InvalidCredentials) ->
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Invalid email or password."))
      |> sign_in_form()
      |> web.html(401)

    Error(DatabaseFailure(err)) -> {
      wisp.log_error("sign in database failure: " <> string.inspect(err))
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> sign_in_form()
      |> web.html(500)
    }

    Error(UnexpectedDatabaseResult) -> {
      wisp.log_error("sign in: unexpected database result")
      get_sign_in_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> sign_in_form()
      |> web.html(500)
    }
  }
}

pub fn sign_out(req: Request, ctx: Ctx) -> Response {
  use session <- auth_session.require(req, ctx)

  let result =
    auth_session_sql.delete_auth_session_by_id(ctx.db, session.id)
    |> result.map_error(DatabaseFailure)
    |> result.replace(Nil)

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/sign-in")
      |> auth_session.clear_cookie(req)

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

type SignInForm {
  SignInForm(email: String, password: String)
}

fn get_sign_in_form() -> Form(SignInForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
    })
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
    })
    form.success(SignInForm(email:, password:))
  }

  form.new(schema)
  |> form.language(fn(error: FieldError) -> String {
    case error {
      MustBeEmail -> "please enter a valid email address"
      _ -> form.en_gb(error)
    }
  })
}

fn sign_in_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn sign_in_form(form: Form(SignInForm)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-in"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("sign in"),
          ]),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("email:"),
              html.input([
                attribute.id("email_input"),
                attribute.type_("email"),
                attribute.class("border-b-2 border-current"),
                attribute.placeholder("hello@google.com"),
                attribute.name("email"),
                attribute.value(form.field_value(form, "email")),
                attribute.aria_invalid(
                  string.lowercase(bool.to_string(result.is_ok(email_err))),
                ),
              ]),
              case email_err {
                Ok(msg) ->
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(msg)],
                  )
                Error(_) -> element.none()
              },
            ],
          ),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("password:"),
              html.input([
                attribute.id("password_input"),
                attribute.type_("password"),
                attribute.class("border-b-2 border-current"),
                attribute.placeholder("********"),
                attribute.name("password"),
                attribute.value(form.field_value(form, "password")),
                attribute.aria_invalid(
                  string.lowercase(bool.to_string(result.is_ok(password_err))),
                ),
              ]),
              case password_err {
                Ok(msg) ->
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(msg)],
                  )
                Error(_) -> element.none()
              },
            ],
          ),
          case root_err {
            Ok(msg) ->
              ui.alert([
                ui.alert_title(element.text("sign in failed")),
                ui.alert_description(element.text(msg)),
              ])
            Error(_) -> element.none()
          },
          ui.button([attribute.type_("submit")], [
            html.text("sign in"),
            ui.spinner(),
          ]),

          html.div([attribute.class("flex justify-between")], [
            html.a(
              [
                attribute.href("/reset-password"),
                attribute.class(
                  "text-right text-sm underline hover:text-current/80 transition-colors",
                ),
              ],
              [element.text("forgot password?")],
            ),
            html.p([attribute.class("text-right text-sm")], [
              element.text("don't have an account? "),
              html.a(
                [
                  attribute.href("/sign-up"),
                  attribute.class(
                    "underline hover:text-current/80 transition-colors",
                  ),
                ],
                [element.text("sign up")],
              ),
            ]),
          ]),
        ],
      ),
    ],
  )
}
