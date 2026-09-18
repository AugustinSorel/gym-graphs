import app/ui
import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type CurrentStep {
  VerifyPassword
  SetNewPassword
}

fn current_step_indication(current_step: CurrentStep) {
  let verify_step = #("01", "verify your password")
  let set_password_step = #("02", "set new password")

  let #(current_info, upcoming_steps) = case current_step {
    VerifyPassword -> #(verify_step, [set_password_step])
    SetNewPassword -> #(set_password_step, [])
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
          [html.text(step_num <> "\t" <> step_title <> " ")],
        )
      }),
    ),
  ])
}

fn password_update_layout(
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

// ── Verify password step ──────────────────────────────────────────────────────

pub type VerifyPasswordForm {
  VerifyPasswordForm(password: String)
}

pub fn get_verify_password_form() -> Form(VerifyPasswordForm) {
  let schema = {
    use password <- form.field("password", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_more_than(7)
      |> form.check_string_length_less_than(72)
    })

    form.success(VerifyPasswordForm(password:))
  }

  form.new(schema)
}

pub fn verify_password_page(children: Element(a)) -> Element(a) {
  password_update_layout(VerifyPassword, "Update your password", children)
}

pub fn verify_password_form(form: Form(VerifyPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/update-password/verify-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
    ],
    [
      html.input([
        attribute.type_("hidden"),
        attribute.name("email"),
        attribute.attribute("autocomplete", "email"),
        attribute.value(email_address),
      ]),
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.text("current password:"),
          ui.input([
            attribute.type_("password"),
            attribute.name("password"),
            attribute.placeholder("********"),
            attribute.value(form.field_value(form, "password")),
            attribute.attribute("autocomplete", "current-password"),
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
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("continue"),
        ui.spinner(),
      ]),
      html.div([attribute.class("flex justify-end")], [
        ui.button(
          ui.ButtonLink,
          [
            attribute.type_("button"),
            attribute.attribute("hx-post", "/update-password/cancel"),
            attribute.attribute("hx-disable", "this"),
          ],
          [html.text("cancel"), ui.spinner()],
        ),
      ]),
    ],
  )
}

// ── Set new password step ─────────────────────────────────────────────────────

pub type SetNewPasswordForm {
  SetNewPasswordForm(password: String)
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

  form.new(schema)
}

pub fn set_new_password_page(children: Element(a)) -> Element(a) {
  password_update_layout(SetNewPassword, "Set your new password", children)
}

pub fn set_new_password_form(form: Form(SetNewPasswordForm)) -> Element(a) {
  let email_address = form.field_value(form, "email")
  let password_err = list.first(form.field_error_messages(form, "password"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/update-password/set-new-password"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col py-10 px-5 lg:px-10 gap-10"),
    ],
    [
      html.input([
        attribute.type_("hidden"),
        attribute.name("email"),
        attribute.attribute("autocomplete", "email"),
        attribute.value(email_address),
      ]),
      html.label(
        [
          attribute.class("grid gap-1 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.text("new password:"),
          ui.input([
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
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("update password"),
        ui.spinner(),
      ]),
      html.div([attribute.class("flex justify-end")], [
        ui.button(
          ui.ButtonLink,
          [
            attribute.type_("button"),
            attribute.attribute("hx-post", "/update-password/cancel"),
            attribute.attribute("hx-target", "closest form"),
            attribute.attribute("hx-swap", "outerHTML"),
            attribute.attribute("hx-disable", "this"),
          ],
          [html.text("cancel"), ui.spinner()],
        ),
      ]),
    ],
  )
}
