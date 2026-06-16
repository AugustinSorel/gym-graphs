import app/ui
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

pub type EmailRegisterForm {
  EmailRegisterForm(email: String)
}

pub type VerifyEmailAddressForm {
  VerifyEmailAddressForm(code: String)
}

pub type SetPasswordForm {
  SetPasswordForm(password: String)
}

// ---------------------------------------------------------------------------
// Sign up (register) UI
// ---------------------------------------------------------------------------

pub fn get_register_form() -> Form(EmailRegisterForm) {
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

pub fn register_form(form: Form(EmailRegisterForm)) -> Element(a) {
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
          html.label([attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              )], [
            html.text("email:"),
            ui.input([
              attribute.id("email_input"),
              attribute.type_("email"),
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
                  [attribute.role("alert"), attribute.class("text-error text-sm")],
                  [html.text(msg)],
                )
              Error(_) -> element.none()
            },
          ]),

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

// ---------------------------------------------------------------------------
// Verify email UI
// ---------------------------------------------------------------------------

pub fn get_verify_email_form() -> Form(VerifyEmailAddressForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailAddressForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub fn verify_email_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

pub fn verify_email_form(form: Form(VerifyEmailAddressForm)) -> Element(a) {
  let code_err = list.first(form.field_error_messages(form, "code"))
  let root_err = list.first(form.field_error_messages(form, "root"))
  let success_msg = form.field_value(form, "success_msg")

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up/verify-email-address"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("verify email address"),
          ]),
          html.label([attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              )], [
            html.text("verification code:"),
            ui.input([
              attribute.id("code_input"),
              attribute.type_("text"),
              attribute.attribute("inputmode", "numeric"),
              attribute.placeholder("12345678"),
              attribute.name("code"),
              attribute.value(form.field_value(form, "code")),
              attribute.aria_invalid(
                string.lowercase(bool.to_string(result.is_ok(code_err))),
              ),
            ]),
            case code_err {
              Ok(msg) ->
                html.p(
                  [attribute.role("alert"), attribute.class("text-error text-sm")],
                  [html.text(msg)],
                )
              Error(_) -> element.none()
            },
          ]),

          case root_err {
            Ok(msg) -> {
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            }
            Error(_) -> element.none()
          },

          case string.is_empty(success_msg) {
            False -> {
              ui.alert_variant(ui.AlertSuccess, [
                ui.alert_title(element.text("verification code sent")),
                ui.alert_description(element.text(success_msg)),
              ])
            }
            True -> element.none()
          },

          ui.button([attribute.type_("submit")], [
            html.text("verify"),
            ui.spinner(),
          ]),
          html.div([attribute.class("flex justify-between")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute(
                  "hx-post",
                  "/sign-up/verify-email-address/resend",
                ),
                attribute.attribute("hx-disable", "this"),
                attribute.attribute("hx-target", "closest form"),
                attribute.attribute("hx-swap", "outerHTML"),
                attribute.class(
                  "underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
                ),
              ],
              [html.text("resend verification code"), ui.spinner()],
            ),
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute(
                  "hx-post",
                  "/sign-up/verify-email-address/cancel",
                ),
                attribute.attribute("hx-disable", "this"),
                attribute.class(
                  "ml-auto underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
                ),
              ],
              [html.text("cancel"), ui.spinner()],
            ),
          ]),
        ],
      ),
    ],
  )
}

// ---------------------------------------------------------------------------
// Set password UI
// ---------------------------------------------------------------------------

pub fn get_set_password_form() -> Form(SetPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub fn set_password_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

pub fn set_password_form(form: Form(SetPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email_address")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up/set-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.input([
        attribute.type_("hidden"),
        attribute.name("username"),
        attribute.attribute("autocomplete", "username"),
        attribute.value(email_address),
      ]),
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("set password"),
          ]),
          html.label([attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              )], [
            html.text("password:"),
            ui.input([
              attribute.id("password_input"),
              attribute.type_("password"),
              attribute.name("password"),
              attribute.placeholder("********"),
              attribute.value(form.field_value(form, "password")),
            ]),
            case password_err {
              Ok(msg) ->
                html.p(
                  [attribute.role("alert"), attribute.class("text-error text-sm")],
                  [html.text(msg)],
                )
              Error(_) -> element.none()
            },
          ]),

          case root_err {
            Ok(msg) ->
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            Error(_) -> element.none()
          },

          ui.button([attribute.type_("submit")], [
            html.text("set password"),
            ui.spinner(),
          ]),

          html.button(
            [
              attribute.type_("button"),
              attribute.attribute(
                "hx-post",
                "/sign-up/verify-email-address/cancel",
              ),
              attribute.attribute("hx-disable", "this"),
              attribute.class(
                "ml-auto underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
              ),
            ],
            [html.text("cancel"), ui.spinner()],
          ),
        ],
      ),
    ],
  )
}
