import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import gym_graphs/schemas/sign_up_session_schema.{type StartSchema}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type CurrentStep {
  EnterEmail
  VerifyEmail
  SetPassword
}

fn sign_up_layout(
  current_step: CurrentStep,
  heading: String,
  children: Element(a),
) -> Element(a) {
  ui.layout([
    html.main([attribute.class("grid lg:grid-cols-[1fr_auto_1fr] min-h-dvh")], [
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
      html.section([attribute.class("max-w-xl w-full m-auto space-y-15 p-4")], [
        html.h1([attribute.class("text-xl lg:text-5xl text-center")], [
          html.text(heading),
        ]),
        children,
      ]),
    ]),
  ])
}

fn current_step_indication(current_step: CurrentStep) {
  let email_step = #("01", "enter your email")
  let verify_step = #("02", "verify your email")
  let password_step = #("03", "set your password")

  let #(current_info, upcoming_steps) = case current_step {
    EnterEmail -> #(email_step, [verify_step, password_step])
    VerifyEmail -> #(verify_step, [password_step])
    SetPassword -> #(password_step, [])
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

pub fn register_page(children: Element(a)) -> Element(a) {
  sign_up_layout(EnterEmail, "Create an account", children)
}

pub fn register_form(form: Form(StartSchema)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
      attribute.attribute("hx-swap", "outerHTML"),
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
            attribute.autocomplete("email"),
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
        Ok(msg) -> {
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        }
        Error(_) -> element.none()
      },

      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("continue"),
        ui.spinner(),
      ]),

      html.p([attribute.class("text-right text-sm")], [
        element.text("already have an account? "),
        ui.link([attribute.href("/sign-in")], [element.text("sign in")]),
      ]),
    ],
  )
}

pub fn verify_email_page(children: Element(a)) -> Element(a) {
  sign_up_layout(VerifyEmail, "Check your inbox", children)
}

pub fn set_password_page(children: Element(a)) -> Element(a) {
  sign_up_layout(SetPassword, "Set your password", children)
}
