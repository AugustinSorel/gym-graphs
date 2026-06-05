import app/ui
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

pub fn form(form: Form(SignInForm)) -> Element(a) {
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
                attribute.href("/forgot-password"),
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

pub type SignInForm {
  SignInForm(email: String, password: String)
}

pub fn get_form() -> Form(SignInForm) {
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

  form.new(schema) |> form.language(translate)
}

fn translate(error: FieldError) -> String {
  case error {
    MustBeEmail -> "please enter a valid email address"
    _ -> form.en_gb(error)
  }
}
