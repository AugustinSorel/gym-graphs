import app/sign_up/sign_up_form.{type Create}
import app/ui
import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn form_page() -> Element(a) {
  let values = sign_up_form.create()

  ui.layout(
    html.main([], [
      form(values),
    ]),
  )
}

pub fn form(form: Form(Create)) -> Element(a) {
  let email_err = list.first(form.field_error_messages(form, "email"))

  html.form(
    [
      attribute.attribute("hx-post", "/sign-up"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
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
                    [
                      html.text(msg),
                    ],
                  )
                }
                Error(_) -> element.none()
              },
            ],
          ),

          ui.button([attribute.type_("submit")], [
            html.text("continue"),
            ui.spinner(),
          ]),
        ],
      ),
    ],
  )
}
