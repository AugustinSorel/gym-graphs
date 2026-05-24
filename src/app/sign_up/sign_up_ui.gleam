import app/ui
import formal/form.{type Form}
import gleam/list
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn page() -> Element(a) {
  let f = create_sign_up_form()

  ui.layout(
    html.main([], [
      form(f),
    ]),
  )
}

pub type SignUpForm {
  SignUpForm(email: String)
}

fn create_sign_up_form() {
  form.new({
    use email <- form.field("email", {
      form.parse_email
      |> form.check_string_length_less_than(255)
      |> form.check_string_length_more_than(3)
    })

    form.success(SignUpForm(email:))
  })
}

pub fn form(form: Form(SignUpForm)) -> Element(a) {
  let name_err = list.first(form.field_error_messages(form, "name"))
  // let root_err = list.first(form.field_error_messages(form, "root"))

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
          html.label([attribute.class("grid gap-1")], [
            html.text("email:"),
            html.input([
              attribute.id("email_input"),
              attribute.type_("email"),
              attribute.class("border-b-2 border-current"),
              attribute.placeholder("hello@google.com"),
            ]),
            case name_err {
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
          ]),

          // case root_err {
          //   Ok(msg) -> {
          //     ui.alert([
          //       ui.alert_title(html.text("something went wrong")),
          //       ui.alert_description(html.text(msg)),
          //     ])
          //   }
          //   Error(_) -> element.none()
          // },
          ui.button([attribute.type_("submit")], [
            html.text("continue"),
            ui.spinner(),
          ]),
        ],
      ),
    ],
  )
}
