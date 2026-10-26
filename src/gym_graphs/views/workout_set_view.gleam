import gleam/bool
import gleam/int
import gleam/list
import gleam/option
import gleam/string
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type WeightUnit}
import gym_graphs/domains/weight
import gym_graphs/domains/workout_set.{type SetId}
import gym_graphs/schemas/workout_set_schema.{
  type CreateSetRow, type CreateSetsForm, type EditSetForm,
}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn new_page(
  form: CreateSetsForm,
  exercise_id: ExerciseId,
  weight_unit: WeightUnit,
  path: String,
) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("new sets"),
        ]),
        new_form(form, exercise_id, weight_unit),
      ],
    ),
  ])
}

pub fn new_page_error(path: String, message: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("new sets"),
        ]),
        ui.alert(ui.AlertError, [], [
          ui.alert_title(element.text("loading exercise failed")),
          ui.alert_description([], element.text(message)),
        ]),
        ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
          html.text("back"),
        ]),
      ],
    ),
  ])
}

pub fn new_form(
  form: CreateSetsForm,
  exercise_id: ExerciseId,
  weight_unit: WeightUnit,
) -> Element(a) {
  let exercise_path = "/exercises/" <> int.to_string(exercise_id.value)
  let workout_set_schema.CreateSetsForm(rows:, error:) = form

  html.form(
    [
      attribute.attribute("hx-post", exercise_path <> "/sets/new"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    list.append(new_set_rows(rows, weight_unit), [
      case error {
        option.Some(message) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description([], element.text(message)),
          ])
        option.None -> element.none()
      },
      ui.link(
        [
          attribute.href(exercise_path <> "/sets/row"),
          attribute.class("ml-auto text-outline mb-10"),
          attribute.attribute("hx-get", exercise_path <> "/sets/row"),
          attribute.attribute("hx-target", "this"),
          attribute.attribute("hx-swap", "beforebegin"),
        ],
        [html.text("add set")],
      ),
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(exercise_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ]),
  )
}

fn new_set_rows(
  rows: List(CreateSetRow),
  weight_unit: WeightUnit,
) -> List(Element(a)) {
  list.index_map(rows, fn(row, index) {
    new_set_row(index + 1, row, weight_unit)
  })
}

pub fn new_set_row(
  index: Int,
  row: CreateSetRow,
  weight_unit: WeightUnit,
) -> Element(a) {
  let workout_set_schema.CreateSetRow(
    weight: weight_value,
    repetitions: repetitions_value,
    weight_error:,
    repetitions_error:,
  ) = row
  let legend = case index {
    0 -> "new set"
    index -> "set " <> int.to_string(index)
  }

  html.fieldset([attribute.class("space-y-10 mt-10 first:mt-0")], [
    html.header(
      [
        attribute.class(
          "flex items-center justify-between border-b-4 border-on-surface pb-2",
        ),
      ],
      [
        html.legend([attribute.class("uppercase text-outline text-sm")], [
          html.text(legend),
        ]),
        ui.button(
          ui.ButtonGhost,
          [
            attribute.type_("button"),
            attribute.class("size-9 p-0 text-outline font-normal"),
            attribute.aria_label("remove set"),
            attribute.attribute(
              "hx-on:click",
              "const fs = this.closest('fieldset'); fs.remove(); document.querySelectorAll('form fieldset').forEach((f, i) => { f.querySelector('legend').textContent = 'set ' + (i + 1); });",
            ),
          ],
          [html.text("x")],
        ),
      ],
    ),
    counter_field(
      "weight",
      element.fragment([
        html.text("weight ("),
        html.abbr(
          [
            attribute.title(weight.unit_name(weight_unit)),
            attribute.class("no-underline"),
          ],
          [html.text(weight.unit_abbreviation(weight_unit))],
        ),
        html.text("):"),
      ]),
      weight_value,
      case weight_unit {
        user.Kg -> "80"
        user.Lbs -> "176"
      },
      weight_error,
    ),
    counter_field(
      "repetitions",
      html.text("repetitions:"),
      repetitions_value,
      "10",
      repetitions_error,
    ),
    case index {
      0 ->
        html.script(
          [],
          "const fieldsets = document.querySelectorAll('form fieldset'); fieldsets[fieldsets.length - 1].querySelector('legend').textContent = 'set ' + fieldsets.length;",
        )
      _ -> element.none()
    },
  ])
}

pub fn new_set_row_error(message: String) -> Element(a) {
  html.fieldset([attribute.class("space-y-10 mt-10 first:mt-0")], [
    html.header(
      [
        attribute.class(
          "flex items-center justify-between border-b-4 border-on-surface pb-2",
        ),
      ],
      [
        html.legend([attribute.class("uppercase text-outline text-sm")], [
          html.text("new set"),
        ]),
        ui.button(
          ui.ButtonGhost,
          [
            attribute.type_("button"),
            attribute.class("size-9 p-0 text-outline font-normal"),
            attribute.aria_label("remove set"),
            attribute.attribute(
              "hx-on:click",
              "const fs = this.closest('fieldset'); fs.remove(); document.querySelectorAll('form fieldset').forEach((f, i) => { f.querySelector('legend').textContent = 'set ' + (i + 1); });",
            ),
          ],
          [html.text("x")],
        ),
      ],
    ),

    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("Getting the new set row failed")),
      ui.alert_description([], element.text(message)),
    ]),
  ])
}

fn counter_field(
  name: String,
  label: Element(a),
  value: String,
  placeholder: String,
  error: option.Option(String),
) -> Element(a) {
  let has_error = option.is_some(error)

  html.label(
    [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
    [
      html.span([attribute.class("text-outline text-sm pb-2")], [label]),
      html.div(
        [
          attribute.class(
            "border-y-2 border-dotted border-outline flex items-center",
          ),
        ],
        [
          ui.input([
            attribute.type_("number"),
            attribute.name(name),
            attribute.placeholder(placeholder),
            attribute.autocomplete("off"),
            attribute.value(value),
            attribute.attribute("step", "any"),
            attribute.aria_invalid(string.lowercase(bool.to_string(has_error))),
            attribute.class("border-none flex-1 p-2"),
          ]),
          counter_button(name, False),
          counter_button(name, True),
        ],
      ),
      case error {
        option.Some(message) ->
          html.p(
            [attribute.role("alert"), attribute.class("text-error text-sm")],
            [html.text(message)],
          )
        option.None -> element.none()
      },
    ],
  )
}

fn counter_button(name: String, increment: Bool) -> Element(a) {
  let symbol = case increment {
    True -> "+"
    False -> "-"
  }
  let input = case increment {
    True -> "this.previousElementSibling.previousElementSibling"
    False -> "this.previousElementSibling"
  }
  let minimum = case name {
    "repetitions" -> 1
    _ -> 0
  }
  let operation = case increment {
    True -> "v + 1"
    False -> "Math.max(" <> int.to_string(minimum) <> ", v - 1)"
  }

  ui.button(
    ui.ButtonGhost,
    [
      attribute.type_("button"),
      attribute.class("border-l-2 border-outline border-dotted"),
      attribute.aria_label(symbol <> " 1 " <> name),
      attribute.attribute(
        "hx-on:click",
        "const inp = "
          <> input
          <> "; const v = parseFloat(inp.value) || 0; inp.value = parseFloat(("
          <> operation
          <> ").toFixed(3));",
      ),
    ],
    [html.text(symbol)],
  )
}

pub fn edit_page(
  form: EditSetForm,
  exercise_id: ExerciseId,
  set_id: SetId,
  weight_unit: WeightUnit,
  path: String,
) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("edit set"),
        ]),
        edit_form(form, exercise_id, set_id, weight_unit),
      ],
    ),
  ])
}

pub fn edit_form(
  form: EditSetForm,
  exercise_id: ExerciseId,
  set_id: SetId,
  weight_unit: WeightUnit,
) -> Element(a) {
  let workout_set_schema.EditSetForm(
    weight: weight_value,
    repetitions: repetitions_value,
    done_at:,
    weight_error:,
    repetitions_error:,
    done_at_error:,
    error:,
  ) = form
  let exercise_path = "/exercises/" <> int.to_string(exercise_id.value)
  let set_path = exercise_path <> "/sets/" <> int.to_string(set_id.value)

  html.form(
    [
      attribute.attribute("hx-patch", set_path),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      counter_field(
        "weight",
        element.fragment([
          html.text("weight ("),
          html.abbr(
            [
              attribute.title(weight.unit_name(weight_unit)),
              attribute.class("no-underline"),
            ],
            [html.text(weight.unit_abbreviation(weight_unit))],
          ),
          html.text("):"),
        ]),
        weight_value,
        case weight_unit {
          user.Kg -> "80"
          user.Lbs -> "176"
        },
        weight_error,
      ),
      counter_field(
        "repetitions",
        html.text("repetitions:"),
        repetitions_value,
        "10",
        repetitions_error,
      ),
      html.label(
        [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
        [
          html.span([attribute.class("text-outline text-sm pb-2")], [
            html.text("done at:"),
          ]),
          html.input([
            attribute.type_("datetime-local"),
            attribute.name("done_at"),
            attribute.value(done_at),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(option.is_some(done_at_error))),
            ),
            attribute.class(
              "border-y-2 border-dotted border-outline p-2 bg-transparent w-full focus-visible:outline-none",
            ),
          ]),
          case done_at_error {
            option.Some(message) ->
              html.p(
                [
                  attribute.role("alert"),
                  attribute.class("text-error text-sm"),
                ],
                [html.text(message)],
              )
            option.None -> element.none()
          },
        ],
      ),
      case error {
        option.Some(message) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description([], element.text(message)),
          ])
        option.None -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(exercise_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn edit_error_page(path: String, message: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("edit set"),
        ]),
        ui.alert(ui.AlertError, [], [
          ui.alert_title(element.text("loading set failed")),
          ui.alert_description([], element.text(message)),
        ]),
        ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
          html.text("back"),
        ]),
      ],
    ),
  ])
}

pub fn remove_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("remove set"),
        ]),
        children,
      ],
    ),
  ])
}

pub fn remove_form(exercise_id: ExerciseId, set_id: SetId) -> Element(a) {
  let exercise_path = "/exercises/" <> int.to_string(exercise_id.value)
  let set_path = exercise_path <> "/sets/" <> int.to_string(set_id.value)

  html.form(
    [
      attribute.attribute("hx-delete", set_path),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.p([attribute.class("text-outline")], [
        html.text(
          "Are you sure you want to remove this set? This action cannot be undone.",
        ),
      ]),
      ui.button(ui.ButtonDestroy, [attribute.type_("submit")], [
        html.text("yes, remove set"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(exercise_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn remove_error(message: String) -> Element(a) {
  element.fragment([
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("removing set failed")),
      ui.alert_description([], element.text(message)),
    ]),
    ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
      html.text("back"),
    ]),
  ])
}
