import app/crypto
import app/ctx.{type Ctx}
import app/password_reset_session/password_reset_session
import app/password_reset_session/sql as password_reset_session_sql
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import pog.{type QueryError}
import wisp.{type Request, type Response}

type PasswordResetError {
  Validation(form: Form(ResetPasswordForm))
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
  UserNotFound
}

pub fn view_password_reset_page() -> Response {
  get_password_reset_form()
  |> password_reset_form()
  |> password_reset_page()
  |> web.html(200)
}

pub fn register(req: Request, ctx: Ctx) -> Response {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use user <- result.try(select_user_by_email(ctx.db, input.email))

    use session <- result.try(
      create_reset_password_session(ctx.db, user.email_address),
    )

    //TODO: send verification code
    echo session.verification_code
    let token = password_reset_session.encode_token(session.id, session.secret)

    Ok(token)
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/reset-password/verify-email-code")
      |> password_reset_session.set_cookie(req, token)

    Error(Validation(form:)) ->
      form
      |> password_reset_form()
      |> web.html(422)

    Error(UserNotFound) ->
      get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Account not found"))
      |> password_reset_form()
      |> web.html(404)

    Error(DatabaseFailure(err)) -> {
      wisp.log_error("password reset: database failure: " <> string.inspect(err))
      get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_form()
      |> web.html(500)
    }

    Error(UnexpectedDatabaseResult) -> {
      wisp.log_error("password reset: unexpected database result")
      get_password_reset_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> password_reset_form()
      |> web.html(500)
    }
  }
}

type ResetPasswordForm {
  ResetPasswordForm(email: String)
}

fn get_password_reset_form() -> Form(ResetPasswordForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
    })

    form.success(ResetPasswordForm(email:))
  }

  form.new(schema)
  |> form.language(fn(error: FieldError) -> String {
    case error {
      MustBeEmail -> "please enter a valid email address"
      _ -> form.en_gb(error)
    }
  })
}

fn password_reset_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn password_reset_form(form: Form(ResetPasswordForm)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("reset password"),
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
          case root_err {
            Ok(msg) ->
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            Error(_) -> element.none()
          },
          ui.button([attribute.type_("submit")], [
            html.text("send reset link"),
            ui.spinner(),
          ]),
          html.p([attribute.class("text-right text-sm")], [
            element.text("remembered your password? "),
            html.a(
              [
                attribute.href("/sign-in"),
                attribute.class(
                  "underline hover:text-current/80 transition-colors",
                ),
              ],
              [element.text("sign in")],
            ),
          ]),
        ],
      ),
    ],
  )
}

type ResetPasswordSession {
  ResetPasswordSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_reset_password_session(
  db: pog.Connection,
  email_address: String,
) -> Result(ResetPasswordSession, PasswordResetError) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)

  let email_code = crypto.generate_password_reset_email_code()
  let email_code_salt = crypto.generate_hashing_salt()
  let email_code_hash =
    crypto.hash_password_reset_email_code(email_code, email_code_salt)

  password_reset_session_sql.create_password_reset_session(
    db,
    secret_hash,
    email_code_hash.raw_hash,
    email_code_salt,
    email_address,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_count, []) -> Error(UnexpectedDatabaseResult)
      pog.Returned(_count, [session, ..]) ->
        Ok(ResetPasswordSession(session.id, secret, email_code))
    }
  })
}

fn select_user_by_email(
  db: pog.Connection,
  email: String,
) -> Result(user_sql.SelectUserByEmailAddressRow, PasswordResetError) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_count, []) -> Error(UserNotFound)
      pog.Returned(_count, [user, ..]) -> Ok(user)
    }
  })
}
