import app/ui
import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

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
                attribute.name("password"),
                attribute.placeholder("********"),
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

pub type SetPasswordForm {
  SetPasswordForm(password: String)
}

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

pub fn account_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

pub fn account_details(email: String) -> Element(a) {
  html.main(
    [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
    [
      html.h1([attribute.class("text-lg font-semibold")], [
        html.text("account"),
      ]),
      html.dl([attribute.class("text-sm")], [
        html.dt([], [html.text("email: ")]),
        html.dd([attribute.class("font-semibold")], [html.text(email)]),
      ]),

      ui.button(
        [
          attribute.attribute("hx-post", "/sign-out"),
          attribute.attribute("hx-disable", "this"),
        ],
        [
          html.text("sign out"),
          ui.spinner(),
        ],
      ),
    ],
  )
}

pub fn set_new_password_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
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
      ]),
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("set new password"),
          ]),
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("new password:"),
              html.input([
                attribute.id("password_input"),
                attribute.type_("password"),
                attribute.class("border-b-2 border-current"),
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

          ui.button([attribute.type_("submit")], [
            html.text("set new password"),
            ui.spinner(),
          ]),

          html.div([attribute.class("flex justify-end")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute(
                  "hx-post",
                  "/reset-password/verify-email-code/cancel",
                ),
                attribute.attribute("hx-disable", "this"),
                attribute.class(
                  "underline hover:text-current/80 transition-colors cursor-pointer text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none",
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

  form.new(schema) |> form.language(form.en_gb)
}
