import formal/form.{type Form}
import gleam/bool
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/uri
import gym_graphs/domains/exercise.{type Exercise}
import gym_graphs/domains/tag.{type Tag}
import gym_graphs/schemas/exercise_schema.{type CreateExerciseSchema}
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

pub fn error_page(path: String) -> Element(a) {
  page_layout(
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("loading exercises failed")),
      ui.alert_description([], element.text("Something went wrong.")),
    ]),
    path,
  )
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
        "bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x transition-colors hover:bg-surface-container/50",
      ),
    ],
    [
      html.td([attribute.class("pl-0 p-4 align-middle font-medium lowercase")], [
        html.text(exercise.name.value),
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
