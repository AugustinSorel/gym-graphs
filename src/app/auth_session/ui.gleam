import app/ui
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type SignInForm {
  SignInForm(email: String, password: String)
}

pub fn get_sign_in_form() -> Form(SignInForm) {
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

pub fn sign_in_page(children: Element(a)) -> Element(a) {
  ui.layout([
    html.main([attribute.class("grid lg:grid-cols-[1fr_auto_1fr] min-h-dvh")], [
      sign_in_hero_section(),
      html.hr([attribute.class("bg-current w-1 h-full hidden lg:block")]),
      html.section([attribute.class("max-w-xl w-full m-auto space-y-15 p-4")], [
        html.h1([attribute.class("text-xl lg:text-5xl text-center")], [
          html.text("Welcome back"),
        ]),
        children,
      ]),
    ]),
  ])
}

fn sign_in_hero_section() {
  let text = [
    #("track", "Every session. Every rep. Every weight."),
    #("measure", "Progress is a number. Know yours."),
    #("push", "Last week's max is this week's warm-up."),
    #("grow", "The graph doesn't lie."),
  ]

  html.section(
    [
      attribute.class(
        "bg-surface-container-high hidden lg:grid p-20 grid-rows-[auto_1fr] justify-content-center",
      ),
    ],
    [
      html.header([], [
        html.span([attribute.class("text-sm uppercase")], [
          html.text("gym graphs"),
        ]),
      ]),
      html.ol(
        [
          attribute.class(
            "m-auto flex gap-5 flex-col list-none [counter-reset:my-counter] divide-y divide-current [&>li]:pb-5 border-y pt-5 w-full",
          ),
        ],
        list.map(text, fn(data) {
          let #(title, body) = data

          html.li(
            [
              attribute.class(
                "space-y-1 [&>*]:ml-10 relative before:content-[counter(my-counter,decimal-leading-zero)] before:[counter-increment:my-counter] before:absolute before:-left-0 before:top-2 before:text-sm before:text-outline before:leading-none",
              ),
            ],
            [
              html.h2(
                [
                  attribute.class("text-4xl font-semibold uppercase"),
                ],
                [
                  html.text(title),
                ],
              ),
              html.p([attribute.class("text-sm text-outline")], [
                html.text(body),
              ]),
            ],
          )
        }),
      ),
    ],
  )
}

pub fn sign_in_form(form: Form(SignInForm)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-in"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
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
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.text("password:"),
          ui.input([
            attribute.id("password_input"),
            attribute.type_("password"),
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
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("sign in"),
        ui.spinner(),
      ]),

      html.div(
        [
          attribute.class(
            "flex flex-col text-right text-sm lg:flex-row lg:justify-between gap-1",
          ),
        ],
        [
          ui.link(
            [
              attribute.href("/reset-password"),
              attribute.class(""),
            ],
            [element.text("forgot password?")],
          ),
          html.p([attribute.class("")], [
            element.text("don't have an account? "),
            ui.link([attribute.href("/sign-up")], [element.text("sign up")]),
          ]),
        ],
      ),
    ],
  )
}
