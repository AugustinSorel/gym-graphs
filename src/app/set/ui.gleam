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

    use weight_in_g <- form.field("weight", {
      let max = case weight_unit {
        user.Kg -> 1000.0
        user.Lbs -> 2204.0
      }
      form.parse_float
      |> form.check_float_more_than(-0.001)
      |> form.check_float_less_than(max)
      |> form.map(user.unit_to_grams(_, weight_unit))
    })

    form.success(NewSetForm(repetitions:, weight_in_g:))
  }

  form.new(schema)
}

pub fn new_set_row(
  f: Form(NewSetForm),
  weight_unit: user.WeightUnit,
) -> Element(a) {
  let weight_placeholder = case weight_unit {
    user.Kg -> "80"
    user.Lbs -> "176"
  }

  let repetitions_err = list.first(form.field_error_messages(f, "repetitions"))
  let weight_err = list.first(form.field_error_messages(f, "weight"))

  html.tr(
    [
      attribute.class(
        "bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x",
      ),
    ],
    [
      html.td(
        [
          attribute.class(
            "pl-0 p-4 align-middle has-[>[aria-invalid=true]]:text-error",
          ),
        ],
        [
          html.input([
            attribute.step("any"),
            attribute.type_("number"),
            attribute.name("weight"),
            attribute.value(form.field_value(f, "weight")),
            attribute.attribute("autocomplete", "off"),
            attribute.attribute("autofocus", ""),
            attribute.placeholder(weight_placeholder),
            attribute.class("w-full text-lg py-1 px-2"),
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
                  attribute.class("text-error text-sm mt-1"),
                ],
                [html.text(msg)],
              )
            Error(_) -> element.none()
          },
        ],
      ),
      html.td(
        [
          attribute.class(
            "p-4 align-middle has-[>[aria-invalid=true]]:text-error",
          ),
        ],
        [
          html.input([
            attribute.type_("number"),
            attribute.name("repetitions"),
            attribute.value(form.field_value(f, "repetitions")),
            attribute.attribute("autocomplete", "off"),
            attribute.placeholder("10"),
            attribute.class("w-full text-lg py-1 px-2"),
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
                  attribute.class("text-error text-sm mt-1"),
                ],
                [html.text(msg)],
              )
            Error(_) -> element.none()
          },
        ],
      ),
      html.td([attribute.class("pr-0 p-4 align-middle w-0")], [
        ui.button(
          ui.ButtonLink,
          [
            attribute.type_("button"),
            attribute.attribute("hx-on:click", "this.closest('tr').remove()"),
          ],
          [html.text("remove")],
        ),
      ]),
    ],
  )
}

pub fn new_set_form(
  rows: List(Form(NewSetForm)),
  exercise_id: String,
  weight_unit: user.WeightUnit,
) -> Element(a) {
  let root_err =
    list.find_map(rows, fn(f) {
      f |> form.field_error_messages("root") |> list.first()
    })

  let th_class =
    "h-10 p-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide"

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
      html.table([attribute.class("caption-bottom text-sm w-full")], [
        html.thead([attribute.class("border-b-2 text-nowrap")], [
          html.tr([], [
            html.th([attribute.class(th_class <> " pl-0")], [
              html.text("weight ("),
              ui.display_weight_unit(weight_unit),
              html.text(")"),
            ]),
            html.th([attribute.class(th_class)], [
              html.text("repetitions"),
            ]),
            html.th([attribute.class(th_class <> " pr-0 w-0")], []),
          ]),
        ]),
        html.tbody(
          [attribute.id("set-rows")],
          list.map(rows, new_set_row(_, weight_unit)),
        ),
      ]),
      case root_err {
        Ok(msg) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        Error(_) -> element.none()
      },
      ui.button(
        ui.ButtonLink,
        [
          attribute.type_("button"),
          attribute.attribute(
            "hx-get",
            "/exercises/" <> exercise_id <> "/sets/row",
          ),
          attribute.attribute("hx-target", "#set-rows"),
          attribute.attribute("hx-swap", "beforeend"),
          attribute.class("ml-auto"),
        ],
        [html.text("+ add set")],
      ),
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
