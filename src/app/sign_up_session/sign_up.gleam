import app/auth_session/auth_session
import app/crypto
import app/ctx.{type Ctx}
import app/sign_up_session/sign_up_session
import app/sign_up_session/sql as sign_up_session_sql
import app/ui
import app/user/sql as user_sql
import app/web
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bit_array
import gleam/bool
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import pog.{type QueryError}
import wisp.{type Request, type Response}

type SignUpError {
  Validation(form: Form(EmailRegisterForm))
  EmailAlreadyTaken
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
}

pub fn view_register_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  get_register_form()
  |> register_form()
  |> register_page()
  |> web.html(200)
}

//FIX: rename this
pub fn register(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      get_register_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    use _ <- result.try(ensure_email_available(ctx.db, input.email))

    use session <- result.try(create_sign_up_session(ctx.db, input.email))

    //TODO: send email code
    echo session.verification_code

    Ok(encode_token(session.id, session.secret))
  }

  case result {
    Ok(token) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/sign-up/verify-email-address")
      |> sign_up_session.set_cookie(req, token)

    Error(Validation(form:)) ->
      form
      |> register_form()
      |> web.html(422)

    Error(EmailAlreadyTaken) ->
      get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Email address already taken."),
      )
      |> register_form()
      |> web.html(409)

    Error(DatabaseFailure(err)) -> {
      wisp.log_error("sign up: database failure: " <> string.inspect(err))
      get_register_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> register_form()
      |> web.html(500)
    }

    Error(UnexpectedDatabaseResult) -> todo
  }
}

type EmailRegisterForm {
  EmailRegisterForm(email: String)
}

fn get_register_form() -> Form(EmailRegisterForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
      |> form.check_string_length_more_than(3)
    })

    form.success(EmailRegisterForm(email:))
  }

  form.new(schema)
  |> form.language(fn(error: FieldError) -> String {
    case error {
      MustBeEmail -> "please enter a valid email address"
      _ -> form.en_gb(error)
    }
  })
}

pub fn register_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

fn register_form(form: Form(EmailRegisterForm)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("sign up form"),
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
                Ok(msg) -> {
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(msg)],
                  )
                }
                Error(_) -> element.none()
              },
            ],
          ),

          case root_err {
            Ok(msg) -> {
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            }
            Error(_) -> element.none()
          },

          ui.button([attribute.type_("submit")], [
            html.text("continue"),
            ui.spinner(),
          ]),

          html.p([attribute.class("text-right text-sm")], [
            element.text("already have an account? "),
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

fn ensure_email_available(db: pog.Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

type SignUpSession {
  SignUpSession(id: Int, secret: BitArray, verification_code: String)
}

fn create_sign_up_session(db: pog.Connection, email: String) {
  let secret = crypto.generate_session_secret()
  let secret_hash = crypto.hash_session_secret(secret)
  let verification_code = crypto.generate_email_verification_code()

  sign_up_session_sql.create_sign_up_session(
    db,
    secret_hash,
    email,
    verification_code,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(session) {
    case session {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, _) -> Error(UnexpectedDatabaseResult)
    }
  })
  |> result.map(fn(session) {
    SignUpSession(id: session.id, secret:, verification_code:)
  })
}

fn encode_token(id: Int, secret: BitArray) -> String {
  let encoded_secret = bit_array.base64_encode(secret, False)
  int.to_string(id) <> "." <> encoded_secret
}
