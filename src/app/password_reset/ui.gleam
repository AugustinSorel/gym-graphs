import app/ui
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type ResetPasswordForm {
  ResetPasswordForm(email: String)
}

pub type VerifyEmailCodeForm {
  VerifyEmailCodeForm(code: String)
}

pub type SetNewPasswordForm {
  SetNewPasswordForm(password: String)
}

pub type CurrentStep {
  EnterEmail
  VerifyEmailCode
  SetNewPassword
}

fn current_step_indication(current_step: CurrentStep) {
  let email_step = #("01", "enter your email")
  let verify_step = #("02", "verify your email")
  let password_step = #("03", "set new password")

  let #(current_info, upcoming_steps) = case current_step {
    EnterEmail -> #(email_step, [verify_step, password_step])
    VerifyEmailCode -> #(verify_step, [password_step])
    SetNewPassword -> #(password_step, [])
  }

  let #(current_num, current_title) = current_info

  html.div([attribute.class("grid grid-rows-[1fr_auto_1fr]")], [
    html.h1([attribute.class("row-start-2 flex flex-col")], [
      html.span([attribute.class("text-[15rem] font-bold leading-[0.85]")], [
        html.text(current_num),
      ]),
      html.span([attribute.class("text-3xl font-bold uppercase")], [
        html.text(current_title),
      ]),
    ]),

    html.ol(
      [
        attribute.class(
          "row-start-3 flex flex-col justify-end text-outline gap-1",
        ),
      ],
      list.map(upcoming_steps, fn(step) {
        let #(step_num, step_title) = step
        html.li(
          [
            attribute.class(
              "flex items-center whitespace-pre before:bg-current before:left:0 before:w-8 before:mr-3 before:h-px before:inline-block uppercase text-sm",
            ),
          ],
          [
            html.text(step_num <> "\t" <> step_title <> " "),
          ],
        )
      }),
    ),
  ])
}

fn password_reset_layout(
  current_step: CurrentStep,
  heading: String,
  children: Element(a),
) -> Element(a) {
  ui.layout([
    html.main(
      [attribute.class("grid lg:grid-cols-[1fr_auto_1fr] min-h-screen")],
      [
        html.section(
          [
            attribute.class(
              "bg-surface-container-high hidden lg:grid p-20 gap-20 grid-rows-[auto_1fr] justify-content-center",
            ),
          ],
          [
            html.header([], [
              html.span([attribute.class("text-sm uppercase")], [
                html.text("gym graphs"),
              ]),
            ]),
            current_step_indication(current_step),
          ],
        ),
        html.hr([attribute.class("bg-current w-1 h-full hidden lg:block")]),
        html.section(
          [attribute.class("max-w-xl w-full m-auto space-y-15 p-4")],
          [
            html.h1([attribute.class("text-xl lg:text-5xl text-center")], [
              html.text(heading),
            ]),
            children,
          ],
        ),
      ],
    ),
  ])
}

pub fn get_password_reset_form() -> Form(ResetPasswordForm) {
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

pub fn password_reset_page(children: Element(a)) -> Element(a) {
  password_reset_layout(EnterEmail, "Forgot your password?", children)
}

pub fn password_reset_form(form: Form(ResetPasswordForm)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
    ],
    [
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
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
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("send reset link"),
        ui.spinner(),
      ]),
      html.p([attribute.class("text-right text-sm")], [
        element.text("remembered your password? "),
        ui.link([attribute.href("/sign-in")], [element.text("sign in")]),
      ]),
    ],
  )
}

pub fn get_verify_form() -> Form(VerifyEmailCodeForm) {
  let schema = {
    use code <- form.field("code", {
      form.parse_string
      |> form.map(string.uppercase)
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(9)
    })

    form.success(VerifyEmailCodeForm(code:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub fn verify_page(children: Element(a)) -> Element(a) {
  password_reset_layout(VerifyEmailCode, "Check your inbox", children)
}

pub fn verify_form(form: Form(VerifyEmailCodeForm)) -> Element(a) {
  let code_err = list.first(form.field_error_messages(form, "code"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password/verify-email-code"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
    ],
    [
      html.p([attribute.class("text-sm")], [
        html.text("Check your inbox, we sent an 8-digit code."),
      ]),
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.text("verification code:"),
          ui.input([
            attribute.id("code_input"),
            attribute.type_("text"),
            attribute.class("uppercase"),
            attribute.placeholder("A3KX7PQR"),
            attribute.name("code"),
            attribute.value(form.field_value(form, "code")),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(code_err))),
            ),
          ]),
          case code_err {
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
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("verify"),
        ui.spinner(),
      ]),
      html.div([attribute.class("flex justify-end")], [
        ui.button(
          ui.ButtonLink,
          [
            attribute.type_("button"),
            attribute.attribute(
              "hx-post",
              "/reset-password/verify-email-code/cancel",
            ),
            attribute.attribute("hx-disable", "this"),
            attribute.attribute("hx-target", "closest form"),
            attribute.attribute("hx-swap", "outerHTML"),
          ],
          [html.text("cancel"), ui.spinner()],
        ),
      ]),
    ],
  )
}

pub fn get_set_new_password_form() -> Form(SetNewPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(SetNewPasswordForm(password:))
  }

  form.new(schema) |> form.language(form.en_gb)
}

pub fn set_new_password_page(children: Element(a)) -> Element(a) {
  password_reset_layout(SetNewPassword, "Set a new password", children)
}

pub fn set_new_password_form(form: Form(SetNewPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email_address")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/reset-password/set-new-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.input([
        attribute.type_("hidden"),
        attribute.name("username"),
        attribute.attribute("autocomplete", "username"),
        attribute.value(email_address),
        attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
      ]),
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.text("new password:"),
          ui.input([
            attribute.id("password_input"),
            attribute.type_("password"),
            attribute.name("password"),
            attribute.placeholder("********"),
            attribute.value(form.field_value(form, "password")),
            attribute.attribute("autocomplete", "new-password"),
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
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        Error(_) -> element.none()
      },

      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("set new password"),
        ui.spinner(),
      ]),

      html.div([attribute.class("flex justify-end")], [
        ui.button(
          ui.ButtonLink,
          [
            attribute.type_("button"),
            attribute.attribute(
              "hx-post",
              "/reset-password/verify-email-code/cancel",
            ),
            attribute.attribute("hx-disable", "this"),
          ],
          [html.text("cancel"), ui.spinner()],
        ),
      ]),
    ],
  )
}
