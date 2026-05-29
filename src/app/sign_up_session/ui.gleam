import app/ui
import formal/form.{type FieldError, type Form, MustBeEmail}
import gleam/bool
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn create_sign_up_session_page() -> Element(a) {
  let form = get_sign_up_session_form()

  ui.layout(
    html.main([], [
      create_sign_up_session_form(form),
    ]),
  )
}

pub fn create_sign_up_session_form(
  form: Form(CreateSignUpSessionForm),
) -> Element(a) {
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

pub type CreateSignUpSessionForm {
  CreateSignUpSessionForm(email: String)
}

pub fn get_sign_up_session_form() -> Form(CreateSignUpSessionForm) {
  let schema = {
    use email <- form.field("email", {
      form.parse_email
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(255)
      |> form.check_string_length_more_than(3)
    })

    form.success(CreateSignUpSessionForm(email:))
  }

  form.new(schema) |> form.language(translate)
}

fn translate(error: FieldError) -> String {
  case error {
    MustBeEmail -> "please enter a valid email address"
    _ -> form.en_gb(error)
  }
}
