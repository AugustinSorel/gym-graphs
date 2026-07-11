import app/ui
import app/user/user
import formal/form.{type Form}
import gleam/list
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request}

pub type NewSetForm {
  NewSetForm(repetitions: Int, weight_in_g: Int)
}

pub fn get_new_set_form(weight_unit: user.WeightUnit) -> Form(NewSetForm) {
  let schema = {
    use repetitions <- form.field("repetitions", {
      form.parse_int
      |> form.check_int_more_than(0)
      |> form.check_int_less_than(1000)
    })

    use weight_in_g <- form.field("weight_in_g", {
      let max = case weight_unit {
        user.Kg -> 1000.0
        user.Lbs -> 2204.0
      }
      form.parse_float
      |> form.check_float_more_than(-0.001)
      |> form.check_float_less_than(max)
      |> form.map(fn(value) { user.unit_to_grams(value, weight_unit) })
    })

    form.success(NewSetForm(repetitions:, weight_in_g:))
  }

  form.new(schema)
}

pub fn new_set_form(
  f: Form(NewSetForm),
  exercise_id: String,
  weight_unit: user.WeightUnit,
) -> Element(a) {
  let repetitions_err = list.first(form.field_error_messages(f, "repetitions"))
  let weight_err = list.first(form.field_error_messages(f, "weight_in_g"))
  let root_err = list.first(form.field_error_messages(f, "root"))
  let #(weight_label, weight_placeholder) = case weight_unit {
    user.Kg -> #("weight (kg):", "80")
    user.Lbs -> #("weight (lbs):", "176")
  }

  html.form(
    [
      attribute.attribute(
        "hx-post",
        "/exercises/" <> exercise_id <> "/sets/new",
      ),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.label(
        [
          attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("repetitions:"),
          ]),
          ui.input([
            attribute.type_("number"),
            attribute.name("repetitions"),
            attribute.value(form.field_value(f, "repetitions")),
            attribute.attribute("autocomplete", "off"),
            attribute.attribute("autofocus", ""),
            attribute.placeholder("10"),
            attribute.aria_invalid(case repetitions_err {
              Ok(_) -> "true"
              Error(_) -> "false"
            }),
          ]),
          case repetitions_err {
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
          attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text(weight_label),
          ]),
          ui.input([
            attribute.type_("number"),
            attribute.name("weight_in_g"),
            attribute.value(form.field_value(f, "weight_in_g")),
            attribute.attribute("autocomplete", "off"),
            attribute.placeholder(weight_placeholder),
            attribute.aria_invalid(case weight_err {
              Ok(_) -> "true"
              Error(_) -> "false"
            }),
          ]),
          case weight_err {
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
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link(
        [
          attribute.href("/exercises/" <> exercise_id),
          attribute.class("ml-auto"),
        ],
        [html.text("cancel")],
      ),
    ],
  )
}

pub fn new_set_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [children],
    ),
  ])
}
