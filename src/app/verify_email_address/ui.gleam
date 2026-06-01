import app/ui
import formal/form.{type Form}
import gleam/option
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn verify_email_address_page(children: Element(a)) -> Element(a) {
  ui.layout(html.main([], [children]))
}

pub type FieldErrors {
  FieldErrors(code: option.Option(String))
}

pub type RootMsg {
  RootErr(msg: String)
  RootSuccess(msg: String)
}

pub fn verify_email_address_form(
  field_values field_values: VerifyEmailAddressForm,
  field_errors field_errors: option.Option(FieldErrors),
  root_msg root_msg: option.Option(RootMsg),
) -> Element(a) {
  html.form(
    [
      attribute.attribute("hx-post", "/verify-email-address"),
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
          html.label(
            [
              attribute.class(
                "grid gap-1 has-[>[aria-invalid=true]]:text-error",
              ),
            ],
            [
              html.text("verification code:"),
              html.input([
                attribute.id("code_input"),
                attribute.type_("text"),
                attribute.attribute("inputmode", "numeric"),
                attribute.class("border-b-2 border-current"),
                attribute.placeholder("12345678"),
                attribute.name("code"),
                attribute.value(field_values.code),
                attribute.aria_invalid(case field_errors {
                  option.Some(FieldErrors(code: option.Some(_))) -> "true"
                  option.Some(_) | option.None -> "false"
                }),
              ]),

              case field_errors {
                option.Some(FieldErrors(code: option.Some(code))) ->
                  html.p(
                    [
                      attribute.role("alert"),
                      attribute.class("text-error text-sm"),
                    ],
                    [html.text(code)],
                  )
                option.Some(_) | option.None -> element.none()
              },
            ],
          ),

          case root_msg {
            option.Some(RootSuccess(msg)) -> {
              ui.alert_variant(ui.AlertSuccess, [
                ui.alert_title(element.text("verification code sent")),
                ui.alert_description(element.text(msg)),
              ])
            }
            option.Some(RootErr(msg)) -> {
              ui.alert([
                ui.alert_title(element.text("something went wrong")),
                ui.alert_description(element.text(msg)),
              ])
            }
            option.None -> element.none()
          },

          ui.button([attribute.type_("submit")], [
            html.text("verify"),
            ui.spinner(),
          ]),
          html.div([attribute.class("flex justify-between")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.attribute("hx-post", "/verify-email-address/resend"),
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
                attribute.attribute("hx-post", "/verify-email-address/cancel"),
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

pub type VerifyEmailAddressForm {
  VerifyEmailAddressForm(code: String)
}

pub fn get_verify_email_address_form() -> Form(VerifyEmailAddressForm) {
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
