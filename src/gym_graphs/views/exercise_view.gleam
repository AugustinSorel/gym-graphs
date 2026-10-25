import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import gleam/uri
import gym_graphs/domains/exercise.{type Exercise}
import gym_graphs/domains/one_rep_max
import gym_graphs/domains/tag.{type Tag}
import gym_graphs/domains/user.{type OneRepMaxAlgorithm, type WeightUnit}
import gym_graphs/domains/weight.{type Weight}
import gym_graphs/domains/workout_set.{type ExerciseSet}
import gym_graphs/schemas/exercise_schema.{
  type CreateExerciseSchema, type RenameExerciseSchema,
}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub type ExercisesPage {
  ExercisesPage(
    rows: List(Exercise),
    next_cursor: option.Option(exercise.ExerciseId),
    filter_tag_ids: List(Int),
  )
}

pub type SetsPage {
  SetsPage(
    exercise_id: exercise.ExerciseId,
    rows: List(ExerciseSet),
    total_count: Int,
    next_cursor: option.Option(workout_set.PageCursor),
    weight_unit: WeightUnit,
    one_rep_max_algorithm: OneRepMaxAlgorithm,
  )
}

pub fn page(
  exercise_count: Int,
  tags: List(Tag),
  filter_tag_ids: List(Int),
  exercises_page: ExercisesPage,
  path: String,
) -> Element(a) {
  page_layout(
    element.fragment([
      page_header(exercise_count, tags, filter_tag_ids),
      exercises_table(exercises_page),
    ]),
    path,
  )
}

pub fn error_page(path: String, msg: String) -> Element(a) {
  page_layout(
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("loading exercises failed")),
      ui.alert_description([], element.text(msg)),
    ]),
    path,
  )
}

pub fn detail_page(children: List(Element(a)), path: String) -> Element(a) {
  page_layout(element.fragment(children), path)
}

pub fn exercise_tags(
  exercise_id: exercise.ExerciseId,
  all_tags: List(Tag),
  selected_tags: List(Tag),
) -> Element(a) {
  html.section([], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
        ),
      ],
      [html.text("tags")],
    ),
    exercise_tags_form(
      exercise_id,
      all_tags,
      list.map(selected_tags, fn(tag) { tag.id.value }),
    ),
  ])
}

pub fn exercise_sets(sets_page: SetsPage) -> Element(a) {
  html.section([], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
        ),
      ],
      [html.text("sets")],
    ),
    case sets_page.total_count {
      0 ->
        html.p(
          [
            attribute.class(
              "py-12 border-b-2 border-dotted border-outline/50 text-center text-outline",
            ),
          ],
          [html.text("no sets yet")],
        )
      total_count ->
        html.ol(
          [
            attribute.id("sets-list"),
            attribute.class("list-none"),
            attribute.attribute(
              "style",
              "counter-reset: set-list " <> int.to_string(total_count + 1),
            ),
          ],
          [exercise_set_rows(sets_page)],
        )
    },
  ])
}

pub fn exercise_set_rows(sets_page: SetsPage) -> Element(a) {
  let rows = list.map(sets_page.rows, exercise_set_row(_, sets_page))

  case sets_page.next_cursor {
    option.None -> element.fragment(rows)
    option.Some(cursor) ->
      element.fragment(list.append(rows, [sets_load_more(sets_page, cursor)]))
  }
}

fn exercise_set_row(set: ExerciseSet, sets_page: SetsPage) -> Element(a) {
  let one_rep_max =
    one_rep_max.calculate(
      weight.in_grams(set.weight),
      set.repetitions,
      sets_page.one_rep_max_algorithm,
    )
    |> float.round()
    |> weight.from_grams()

  html.li(
    [
      attribute.class(
        "border-b-2 border-dotted border-outline/50 py-3 [counter-increment:set-list_-1] grid grid-cols-[auto_1fr_auto] items-center gap-x-3 before:content-[counter(set-list)_'.'] before:text-outline before:text-sm",
      ),
    ],
    [
      html.dl([attribute.class("grid grid-cols-3 gap-x-6 gap-y-1 text-sm")], [
        set_metric(
          element.fragment([
            html.text("1"),
            html.abbr(
              [
                attribute.title("repetition maximum"),
                attribute.class("no-underline"),
              ],
              [html.text("rm")],
            ),
          ]),
          optional_weight(one_rep_max, sets_page.weight_unit),
        ),
        set_metric(
          html.text("weight"),
          display_fact_weight(set.weight, sets_page.weight_unit),
        ),
        set_metric(
          html.abbr(
            [
              attribute.title("repetitions"),
              attribute.class("no-underline"),
            ],
            [html.text("reps")],
          ),
          html.text(int.to_string(set.repetitions)),
        ),
      ]),
      set_options(sets_page.exercise_id, set.id),
    ],
  )
}

fn set_options(
  exercise_id: exercise.ExerciseId,
  set_id: workout_set.SetId,
) -> Element(a) {
  let exercise_id = int.to_string(exercise_id.value)
  let set_id = int.to_string(set_id.value)
  let popover_id = "set-menu-" <> set_id
  let anchor_name = "--set-anchor-" <> set_id
  let set_path = "/exercises/" <> exercise_id <> "/sets/" <> set_id

  html.div([attribute.class("relative")], [
    ui.button(
      ui.ButtonGhost,
      [
        attribute.type_("button"),
        attribute.class("size-8 text-outline"),
        attribute.popovertarget(popover_id),
        attribute.aria_label("Set options"),
        attribute.style("anchor-name", anchor_name),
      ],
      [html.text("\u{22ee}")],
    ),
    html.div(
      [
        attribute.id(popover_id),
        attribute.popover(""),
        attribute.class(
          "m-0 mt-0.5 bg-surface-container-low border-2 shadow-lg min-w-36 open:flex flex-col text-center text-sm",
        ),
        attribute.styles([
          #("position-anchor", anchor_name),
          #("position-area", "bottom span-left"),
          #("position-try-fallbacks", "flip-block"),
        ]),
      ],
      [
        html.a(
          [
            attribute.href(set_path <> "/edit"),
            attribute.class(
              "underline py-2 font-semibold hover:bg-surface-container-high focus-visible:bg-surface-container-highest hover:outline-2 focus-visible:outline-2 outline-on-surface",
            ),
          ],
          [html.text("edit")],
        ),
        html.a(
          [
            attribute.href(set_path <> "/confirm-delete"),
            attribute.class(
              "text-error underline py-2 font-semibold hover:bg-error-container/20 focus-visible:bg-error-container/20 hover:outline-2 focus-visible:outline-2 outline-on-surface",
            ),
          ],
          [html.text("remove")],
        ),
      ],
    ),
  ])
}

fn set_metric(label: Element(a), value: Element(a)) -> Element(a) {
  html.div([], [
    html.dt([attribute.class("text-outline text-xs")], [label]),
    html.dd([], [value]),
  ])
}

fn sets_load_more(
  sets_page: SetsPage,
  cursor: workout_set.PageCursor,
) -> Element(a) {
  let workout_set.PageCursor(done_at:, id:) = cursor
  let exercise_id = int.to_string(sets_page.exercise_id.value)
  let cursor_time =
    done_at
    |> timestamp.to_rfc3339(duration.seconds(0))
    |> uri.percent_encode()

  html.li(
    [
      attribute.id("sets-load-more"),
      attribute.attribute(
        "hx-get",
        "/exercises/"
          <> exercise_id
          <> "/sets?cursor="
          <> cursor_time
          <> "&cursor_id="
          <> int.to_string(id.value),
      ),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.attribute("hx-target", "#sets-load-more"),
      attribute.attribute("hx-include", "none"),
      attribute.class("list-none"),
    ],
    [
      html.div(
        [attribute.class("py-3 flex justify-center [.htmx-request_&]:hidden")],
        [
          ui.button(
            ui.ButtonLink,
            [attribute.class("text-outline font-normal no-underline")],
            [html.text("load more")],
          ),
        ],
      ),
      ..list.repeat(
        html.div(
          [
            attribute.class(
              "hidden [.htmx-request_&]:block animate-pulse h-16 border-b-2 border-dotted border-outline/50",
            ),
          ],
          [],
        ),
        times: 3,
      )
    ],
  )
}

pub fn exercise_set_rows_error(message: String) -> Element(a) {
  html.li([], [
    ui.alert(ui.AlertError, [], [
      ui.alert_title(html.text("loading sets failed")),
      ui.alert_description([], html.text(message)),
    ]),
  ])
}

pub fn exercise_manage(selected_exercise: Exercise) -> Element(a) {
  let exercise_id = int.to_string(selected_exercise.id.value)

  html.section([], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
        ),
      ],
      [html.text("manage")],
    ),
    html.div(
      [
        attribute.class(
          "grid lg:grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
        ),
      ],
      [
        html.dl([attribute.class("space-y-1")], [
          html.dt([attribute.class("text-outline text-sm")], [
            html.text("name"),
          ]),
          html.dd([attribute.class("capitalize break-all text-balance")], [
            html.text(selected_exercise.name.value),
          ]),
        ]),
        ui.link(
          [
            attribute.href("/exercises/" <> exercise_id <> "/name"),
            attribute.class("my-auto ml-auto text-sm lg:ml-0"),
          ],
          [html.text("rename")],
        ),
      ],
    ),
    html.div(
      [
        attribute.class(
          "py-7 border-b-2 border-outline/50 border-dotted grid lg:grid-cols-[1fr_auto] gap-y-3 items-center",
        ),
      ],
      [
        html.div([attribute.class("space-y-1")], [
          html.p([attribute.class("text-outline text-sm")], [
            html.text("remove exercise"),
          ]),
          html.p([], [
            html.text("permanently delete this exercise and all its sets."),
          ]),
        ]),
        ui.link(
          [
            attribute.href("/exercises/" <> exercise_id <> "/confirm-delete"),
            attribute.class(
              "text-error my-auto ml-auto text-sm lg:ml-0 hover:text-error/80",
            ),
          ],
          [html.text("delete")],
        ),
      ],
    ),
  ])
}

pub fn rename_page(children: Element(a), path: String) -> Element(a) {
  page_layout(
    element.fragment([
      html.h1([attribute.class("font-semibold text-3xl")], [
        html.text("rename exercise"),
      ]),
      children,
    ]),
    path,
  )
}

pub fn rename_form(
  form: Form(RenameExerciseSchema),
  id: exercise.ExerciseId,
) -> Element(a) {
  let name_error = list.first(form.field_error_messages(form, "name"))
  let root_error = list.first(form.field_error_messages(form, "root"))
  let detail_path = "/exercises/" <> int.to_string(id.value)

  html.form(
    [
      attribute.attribute("hx-patch", detail_path <> "/name"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.label(
        [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("exercise name"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(form, "name")),
            attribute.placeholder("bench press"),
            attribute.autocomplete("off"),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(name_error))),
            ),
            attribute.attribute("autofocus", ""),
          ]),
          case name_error {
            Ok(message) ->
              html.p(
                [attribute.role("alert"), attribute.class("text-error text-sm")],
                [html.text(message)],
              )
            Error(_) -> element.none()
          },
        ],
      ),
      case root_error {
        Ok(message) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description([], element.text(message)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(detail_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn rename_error(message: String) -> Element(a) {
  ui.alert(ui.AlertError, [], [
    ui.alert_title(element.text("renaming exercise failed")),
    ui.alert_description([], element.text(message)),
  ])
}

pub fn remove_page(children: Element(a), path: String) -> Element(a) {
  page_layout(
    element.fragment([
      html.h1([attribute.class("font-semibold text-3xl")], [
        html.text("remove exercise"),
      ]),
      children,
    ]),
    path,
  )
}

pub fn remove_form(selected_exercise: Exercise) -> Element(a) {
  let detail_path = "/exercises/" <> int.to_string(selected_exercise.id.value)

  html.form(
    [
      attribute.attribute("hx-delete", detail_path),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.p([attribute.class("text-outline")], [
        html.text("Are you sure you want to remove the exercise "),
        html.strong([attribute.class("text-on-surface")], [
          html.text(selected_exercise.name.value),
        ]),
        html.text(" and all its sets? This action cannot be undone."),
      ]),
      ui.button(ui.ButtonDestroy, [attribute.type_("submit")], [
        html.text("yes, remove exercise"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(detail_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn remove_error(message: String) -> Element(a) {
  element.fragment([
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("removing exercise failed")),
      ui.alert_description([], element.text(message)),
    ]),
    ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
      html.text("back"),
    ]),
  ])
}

pub fn exercise_tags_error(msg: String) {
  ui.alert(ui.AlertError, [], [
    ui.alert_title(element.text("Tags failed")),
    ui.alert_description([], element.text(msg)),
  ])
}

pub fn exercise_tags_form(
  exercise_id: exercise.ExerciseId,
  all_tags: List(Tag),
  selected_tag_ids: List(Int),
) -> Element(a) {
  html.form(
    [
      attribute.id("exercise-tags-form"),
      attribute.attribute(
        "hx-patch",
        "/exercises/" <> int.to_string(exercise_id.value) <> "/tags",
      ),
      attribute.attribute("hx-trigger", "change"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.attribute("hx-target", "#exercise-tags-form"),
      attribute.class(
        "py-7 border-b-2 border-dotted border-outline/50 flex flex-wrap gap-2",
      ),
    ],
    list.map(all_tags, exercise_detail_tag_option(_, selected_tag_ids)),
  )
}

fn exercise_detail_tag_option(
  tag: Tag,
  selected_tag_ids: List(Int),
) -> Element(a) {
  html.label(
    [
      attribute.class(
        "border-2 border-on-surface px-3 py-1 text-sm cursor-pointer transition-colors hover:bg-on-surface/10 has-[:checked]:bg-on-surface has-[:checked]:text-surface has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
      ),
    ],
    [
      html.input([
        attribute.type_("checkbox"),
        attribute.name("tag_ids"),
        attribute.value(int.to_string(tag.id.value)),
        attribute.checked(list.contains(selected_tag_ids, tag.id.value)),
        attribute.class("sr-only"),
      ]),
      html.text(" " <> tag.name.value),
    ],
  )
}

pub fn detail_header(
  selected_exercise: Exercise,
  total_sets: Int,
) -> Element(a) {
  let exercise_id = int.to_string(selected_exercise.id.value)

  html.header(
    [attribute.class("grid grid-cols-[1fr_auto] gap-y-10 lg:gap-y-5")],
    [
      html.h1(
        [
          attribute.class(
            "text-3xl font-semibold capitalize col-span-2 break-words",
          ),
        ],
        [html.text(selected_exercise.name.value)],
      ),
      html.span([attribute.class("uppercase text-outline text-sm")], [
        html.text("sets (" <> int.to_string(total_sets) <> ")"),
      ]),
      ui.link([attribute.href("/exercises/" <> exercise_id <> "/sets/new")], [
        html.text("+ add"),
      ]),
    ],
  )
}

pub fn exercise_facts(
  facts: exercise.ExerciseFacts,
  weight_unit: WeightUnit,
) -> Element(a) {
  let exercise.BestSet(weight: best_set_weight, repetitions:) = facts.best_set

  html.section([], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
        ),
      ],
      [html.text("facts")],
    ),
    html.dl(
      [
        attribute.class(
          "py-7 border-b-2 border-dotted border-outline/50 grid grid-cols-2 lg:grid-cols-4 gap-2",
        ),
      ],
      [
        fact(
          element.fragment([
            html.text("best 1"),
            html.abbr(
              [
                attribute.title("repetition maximum"),
                attribute.class("no-underline"),
              ],
              [html.text("rm")],
            ),
          ]),
          optional_weight(facts.best_one_rep_max, weight_unit),
        ),
        fact(html.text("best set"), case weight.is_zero(best_set_weight) {
          True -> html.text("-")
          False ->
            element.fragment([
              display_fact_weight(best_set_weight, weight_unit),
              html.span([attribute.class("text-sm font-normal text-outline")], [
                html.text(" * " <> int.to_string(repetitions)),
              ]),
            ])
        }),
        fact(
          html.abbr(
            [
              attribute.title("average repetitions per set"),
              attribute.class("no-underline"),
            ],
            [html.text("avg reps / set")],
          ),
          case facts.total_sets {
            0 -> html.text("-")
            _ -> html.text(format_one_decimal(facts.average_repetitions))
          },
        ),
        fact(html.text("sessions"), case facts.total_sessions {
          0 -> html.text("-")
          count -> html.text(int.to_string(count))
        }),
      ],
    ),
  ])
}

fn fact(label: Element(a), value: Element(a)) -> Element(a) {
  html.div([attribute.class("grid gap-1")], [
    html.dt([attribute.class("text-outline text-xs")], [label]),
    html.dd([attribute.class("text-xl font-semibold")], [value]),
  ])
}

fn optional_weight(value: Weight, unit: WeightUnit) -> Element(a) {
  case weight.is_zero(value) {
    True -> html.text("-")
    False -> display_fact_weight(value, unit)
  }
}

fn display_fact_weight(value: Weight, unit: WeightUnit) -> Element(a) {
  let weight.DisplayWeight(value: formatted, unit:) =
    weight.display(value, unit)

  element.fragment([
    html.text(formatted <> " "),
    html.abbr(
      [
        attribute.title(weight.unit_name(unit)),
        attribute.class("text-sm font-normal text-outline no-underline"),
      ],
      [html.text(weight.unit_abbreviation(unit))],
    ),
  ])
}

fn format_one_decimal(value: Float) -> String {
  value *. 10.0
  |> float.round()
  |> int.to_float()
  |> fn(value) { value /. 10.0 }
  |> float.to_string()
}

pub fn new_page(
  form: Form(CreateExerciseSchema),
  tags: List(Tag),
  path: String,
) -> Element(a) {
  page_layout(
    element.fragment([
      html.h1([attribute.class("font-semibold text-3xl")], [
        html.text("new exercise"),
      ]),
      new_form(form, tags),
    ]),
    path,
  )
}

pub fn new_page_error(path: String) -> Element(a) {
  page_layout(
    element.fragment([
      html.h1([attribute.class("font-semibold text-3xl")], [
        html.text("new exercise"),
      ]),
      ui.alert(ui.AlertError, [], [
        ui.alert_title(element.text("loading tags failed")),
        ui.alert_description([], element.text("Something went wrong.")),
      ]),
      ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ]),
    path,
  )
}

fn page_layout(content: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [content],
    ),
  ])
}

fn page_header(
  exercise_count: Int,
  tags: List(Tag),
  filter_tag_ids: List(Int),
) -> Element(a) {
  html.header([attribute.class("grid grid-cols-[1fr_auto] gap-4")], [
    html.h1([attribute.class("text-outline uppercase text-sm")], [
      html.text("exercises (" <> int.to_string(exercise_count) <> ")"),
    ]),
    ui.link([attribute.href("/exercises/new")], [html.text("+ add")]),
    tag_filters(tags, filter_tag_ids),
  ])
}

pub fn exercises_table(exercises_page: ExercisesPage) -> Element(a) {
  html.table(
    [
      attribute.id("exercises-table"),
      attribute.class("caption-bottom text-sm table-fixed w-full"),
    ],
    [
      html.thead([attribute.class("border-b-2 text-nowrap")], [
        html.tr([], [
          html.th(
            [
              attribute.class(
                "h-10 pl-0 p-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide",
              ),
              attribute.scope("col"),
            ],
            [html.text("name")],
          ),
        ]),
      ]),
      case exercises_page.rows, exercises_page.filter_tag_ids {
        [], [_, ..] -> no_filter_matches()
        _, _ -> exercise_rows(exercises_page)
      },
    ],
  )
}

pub fn exercise_rows(exercises_page: ExercisesPage) -> Element(a) {
  element.fragment(exercise_row_elements(exercises_page))
}

fn exercise_row_elements(exercises_page: ExercisesPage) -> List(Element(a)) {
  let rows = html.tbody([], list.map(exercises_page.rows, exercise_row))

  case exercises_page.next_cursor {
    option.None -> [rows]
    option.Some(exercise.ExerciseId(exercise_id)) -> [
      rows,
      loading_rows(exercise_id, exercises_page.filter_tag_ids),
    ]
  }
}

fn exercise_row(exercise: Exercise) -> Element(a) {
  html.tr(
    [
      attribute.class(
        "bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x transition-colors hover:bg-surface-container/50 relative",
      ),
    ],
    [
      html.td([attribute.class("pl-0 p-4 align-middle font-medium lowercase")], [
        html.a(
          [
            attribute.href("/exercises/" <> int.to_string(exercise.id.value)),
            attribute.class(
              "before:absolute before:inset-0 before:z-1 font-semibold underline hover:text-current/70 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            ),
          ],
          [html.text(exercise.name.value)],
        ),
      ]),
    ],
  )
}

fn loading_rows(exercise_id: Int, filter_tag_ids: List(Int)) -> Element(a) {
  html.tbody(
    [
      attribute.id("exercises-load-more"),
      attribute.attribute(
        "hx-get",
        "/exercises/rows?cursor="
          <> uri.percent_encode(int.to_string(exercise_id))
          <> filter_query(filter_tag_ids),
      ),
      attribute.attribute("hx-trigger", "revealed"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.attribute("hx-target", "#exercises-load-more"),
      attribute.attribute("hx-include", "none"),
      attribute.aria_label("Loading more exercises"),
    ],
    list.repeat(
      html.tr([], [
        html.td(
          [
            attribute.class(
              "animate-pulse h-13 bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x",
            ),
            attribute.aria_hidden(True),
            attribute.attribute("colspan", "1"),
          ],
          [],
        ),
      ]),
      times: 3,
    ),
  )
}

fn filter_query(filter_tag_ids: List(Int)) -> String {
  filter_tag_ids
  |> list.map(fn(tag_id) {
    "&filter_tag_ids=" <> uri.percent_encode(int.to_string(tag_id))
  })
  |> string.concat()
}

fn no_filter_matches() -> Element(a) {
  html.tbody([], [
    html.tr([], [
      html.td([attribute.class("py-12 text-center text-outline")], [
        html.text("no exercises match these filters"),
      ]),
    ]),
  ])
}

pub fn exercise_rows_error(msg: String) -> Element(a) {
  html.tbody([], [
    html.tr([], [
      html.td([attribute.class("py-4")], [
        ui.alert(ui.AlertError, [], [
          ui.alert_title(html.text("loading exercises failed")),
          ui.alert_description([], html.text(msg)),
        ]),
      ]),
    ]),
  ])
}

pub fn new_form(
  form: Form(CreateExerciseSchema),
  tags: List(Tag),
) -> Element(a) {
  let name_error = list.first(form.field_error_messages(form, "name"))
  let tag_ids_error = list.first(form.field_error_messages(form, "tag_ids"))
  let root_error = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/exercises"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.label(
        [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("name:"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(form, "name")),
            attribute.autocomplete("off"),
            attribute.placeholder("bench press"),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(name_error))),
            ),
            attribute.attribute("autofocus", ""),
          ]),
          case name_error {
            Ok(message) ->
              html.p(
                [attribute.role("alert"), attribute.class("text-error text-sm")],
                [html.text(message)],
              )
            Error(_) -> element.none()
          },
        ],
      ),
      exercise_tag_fields(form, tags, tag_ids_error),
      case root_error {
        Ok(message) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description([], element.text(message)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

fn exercise_tag_fields(
  form: Form(CreateExerciseSchema),
  tags: List(Tag),
  tag_ids_error: Result(String, Nil),
) -> Element(a) {
  case tags {
    [] -> element.none()
    _ ->
      html.fieldset([attribute.class("grid gap-3")], [
        html.legend([attribute.class("text-outline text-sm mb-3")], [
          html.text("tags:"),
        ]),
        html.div(
          [attribute.class("flex flex-wrap gap-2")],
          list.map(tags, exercise_tag_option(form, _)),
        ),
        case tag_ids_error {
          Ok(message) ->
            html.p(
              [attribute.role("alert"), attribute.class("text-error text-sm")],
              [html.text(message)],
            )
          Error(_) -> element.none()
        },
      ])
  }
}

fn exercise_tag_option(
  form: Form(CreateExerciseSchema),
  tag: Tag,
) -> Element(a) {
  let id = int.to_string(tag.id.value)

  html.label(
    [
      attribute.class(
        "border-2 border-on-surface px-3 py-1 text-sm cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
      ),
    ],
    [
      html.input([
        attribute.type_("checkbox"),
        attribute.name("tag_ids"),
        attribute.value(id),
        attribute.checked(list.contains(form.field_values(form, "tag_ids"), id)),
        attribute.class("sr-only"),
      ]),
      html.text(" " <> tag.name.value),
    ],
  )
}

fn tag_filters(tags: List(Tag), filter_tag_ids: List(Int)) -> Element(a) {
  case tags {
    [] -> element.none()
    _ ->
      element.fragment([
        html.details([attribute.class("group col-span-2 space-y-4")], [
          html.summary(
            [
              attribute.class(
                "cursor-pointer items-center gap-2 text-outline text-xs select-none outline-none focus-visible:ring-3 focus-visible:ring-offset-4 focus-visible:ring-offset-surface",
              ),
            ],
            [
              html.text("filters "),
              html.output(
                [
                  attribute.id("filter-count"),
                  attribute.class(
                    "[&:not(:empty)]:before:content-['_('] [&:not(:empty)]:after:content-[')']",
                  ),
                ],
                [],
              ),
            ],
          ),
          html.form(
            [
              attribute.id("exercises-filter-form"),
              attribute.attribute("hx-get", "/exercises"),
              attribute.attribute("hx-trigger", "change"),
              attribute.attribute("hx-target", "#exercises-table"),
              attribute.attribute("hx-swap", "outerHTML"),
              attribute.attribute("hx-push-url", "true"),
            ],
            [
              html.fieldset(
                [
                  attribute.class(
                    "space-y-2 border-b-2 border-outline/50 border-dotted pb-6",
                  ),
                ],
                [
                  html.legend(
                    [attribute.class("uppercase text-outline text-xs sr-only")],
                    [html.text("tags")],
                  ),
                  html.div(
                    [attribute.class("flex flex-wrap gap-2")],
                    list.map(tags, tag_filter(_, filter_tag_ids)),
                  ),
                ],
              ),
            ],
          ),
        ]),
        html.script(
          [],
          "(function () {\n  const form = document.getElementById('exercises-filter-form');\n  const output = document.getElementById('filter-count');\n  function updateCount() {\n    const count = form.querySelectorAll(\"input[name='filter_tag_ids']:checked\").length;\n    output.textContent = count > 0 ? String(count) : '';\n  }\n  form.addEventListener('change', updateCount);\n  updateCount();\n})();",
        ),
      ])
  }
}

fn tag_filter(tag: Tag, filter_tag_ids: List(Int)) -> Element(a) {
  html.label(
    [
      attribute.class(
        "border-2 border-on-surface px-3 py-1 text-sm cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
      ),
    ],
    [
      html.input([
        attribute.type_("checkbox"),
        attribute.name("filter_tag_ids"),
        attribute.value(int.to_string(tag.id.value)),
        attribute.checked(list.contains(filter_tag_ids, tag.id.value)),
        attribute.class("sr-only"),
      ]),
      html.text(" " <> tag.name.value),
    ],
  )
}
