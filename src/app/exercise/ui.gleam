import app/exercise/exercise
import app/ui
import formal/form.{type Form}
import gleam/bool
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request}

pub type NewExerciseForm {
  NewExerciseForm(name: String)
}

pub fn get_new_exercise_form() -> Form(NewExerciseForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(NewExerciseForm(name:))
  }

  form.new(schema)
}

pub fn new_exercise_form(f: Form(NewExerciseForm)) -> Element(a) {
  let name_err = list.first(form.field_error_messages(f, "name"))
  let root_err = list.first(form.field_error_messages(f, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/exercises/new"),
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
            html.text("name:"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(f, "name")),
            attribute.attribute("autocomplete", "off"),
            attribute.attribute("autofocus", ""),
            attribute.placeholder("bench press"),
            attribute.aria_invalid(case name_err {
              Ok(_) -> "true"
              Error(_) -> "false"
            }),
          ]),
          case name_err {
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
      ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn new_exercise_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        children,
      ],
    ),
  ])
}

pub fn exercises_list(
  page: exercise.Page,
  exercises_count: Int,
  query: String,
) -> Element(a) {
  use <- bool.guard(
    when: page.rows == [] && string.is_empty(query),
    return: no_exercises_message(),
  )

  element.fragment([
    html.header([attribute.class("flex items-center justify-between")], [
      html.span([attribute.class("text-outline uppercase text-sm")], [
        html.text("exercises (" <> int.to_string(exercises_count) <> ")"),
      ]),
      ui.link([attribute.href("/exercises/new")], [html.text("+ add")]),
    ]),
    // ui.input([
    //   attribute.type_("search"),
    //   attribute.name("q"),
    //   attribute.value(query),
    //   attribute.placeholder("search..."),
    //   attribute.attribute("autocomplete", "off"),
    //   attribute.attribute("hx-get", "/exercises"),
    //   attribute.attribute(
    //     "hx-trigger",
    //     "input changed delay:200ms, keyup[key=='Enter'], load",
    //   ),
    //   attribute.attribute("hx-target", "tbody"),
    //   attribute.attribute("hx-swap", "innerHTML"),
    //   attribute.attribute("hx-replace-url", "true"),
    //   attribute.attribute("hx-include", "this"),
    //   attribute.class("w-full"),
    // ]),
    html.table([attribute.class("caption-bottom text-sm")], [
      html.thead([attribute.class("border-b-2 text-nowrap")], [
        html.tr([], [
          html.th(
            [
              attribute.class(
                "h-10 pl-0 p-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide",
              ),
            ],
            [html.text("name")],
          ),
          html.th(
            [
              attribute.class(
                "h-10 p-4 pr-0 lg:pr-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide text-right lg:text-left",
              ),
            ],
            [
              html.text("last 1"),
              html.abbr(
                [
                  attribute.title("rep maximum"),
                  attribute.class("no-underline"),
                ],
                [html.text("rm")],
              ),
            ],
          ),
          html.th(
            [
              attribute.class(
                "h-10 p-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide lg:table-cell hidden",
              ),
            ],
            [html.text("sets")],
          ),
          html.th(
            [
              attribute.class(
                "h-10 pr-0 p-4 text-left align-middle font-semibold text-outline uppercase text-xs tracking-wide lg:table-cell hidden",
              ),
            ],
            [html.text("last set")],
          ),
        ]),
      ]),
      html.tbody([], exercises_rows_items(page, query)),
    ]),
  ])
}

fn no_exercises_message() {
  html.section(
    [attribute.class("mt-40 gap-5 flex flex-col items-center text-center")],
    [
      html.span(
        [
          attribute.aria_hidden(True),
          attribute.class(
            "bg-surface-container rounded-md size-12 flex items-center justify-center text-2xl text-outline",
          ),
        ],
        [
          html.text("0"),
        ],
      ),
      html.h1(
        [
          attribute.class("uppercase font-semibold"),
        ],
        [
          html.text("no exercises yet"),
        ],
      ),
      html.p(
        [
          attribute.class("text-balance text-outline text-sm max-w-sm"),
        ],
        [
          html.text(
            "Add your first movement and start building your training logs",
          ),
        ],
      ),
      ui.link([attribute.href("/exercises/new")], [
        html.text("+ add exercise"),
      ]),
    ],
  )
}

fn no_exercises_found() {
  html.section(
    [attribute.class("gap-5 flex flex-col items-center text-center")],
    [
      html.span(
        [
          attribute.aria_hidden(True),
          attribute.class(
            "bg-surface-container rounded-md size-12 flex items-center justify-center text-2xl text-outline",
          ),
        ],
        [
          html.text("0"),
        ],
      ),
      html.h1(
        [
          attribute.class("uppercase font-semibold"),
        ],
        [
          html.text("no exercises found"),
        ],
      ),
      html.p(
        [
          attribute.class("text-balance text-outline text-sm max-w-sm"),
        ],
        [
          html.text(
            "No exercises matched your search. Double-check your spelling or try broader terms",
          ),
        ],
      ),
    ],
  )
}

pub fn exercises_rows(page: exercise.Page, query: String) -> Element(a) {
  element.fragment(exercises_rows_items(page, query))
}

fn exercises_rows_items(
  page: exercise.Page,
  query: String,
) -> List(Element(a)) {
  use <- bool.guard(when: page.rows == [], return: [
    html.tr([], [
      html.td(
        [
          attribute.attribute("colspan", "4"),
          attribute.class("px-4 py-10 text-center text-outline"),
        ],
        [no_exercises_found()],
      ),
    ]),
  ])

  let rows =
    list.map(page.rows, fn(ex) {
      html.tr(
        [
          attribute.class(
            "bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x transition-colors hover:bg-surface-container/50 relative",
          ),
        ],
        [
          html.td(
            [
              attribute.class("pl-0 p-4 align-middle font-medium"),
            ],
            [
              ui.link(
                [
                  attribute.href("/exercises/" <> int.to_string(ex.id)),
                  attribute.class("before:absolute before:inset-0 before:z-1"),
                ],
                [
                  html.text(ex.name),
                ],
              ),
            ],
          ),
          html.td(
            [
              attribute.class(
                "p-4 pr-0 lg:pr-4 align-middle text-outline text-right lg:text-left",
              ),
            ],
            [
              html.text("100 "),
              html.abbr(
                [attribute.title("kilograms"), attribute.class("no-underline")],
                [html.text("kg")],
              ),
            ],
          ),
          html.td(
            [
              attribute.class(
                "p-4 align-middle text-outline lg:table-cell hidden",
              ),
            ],
            [
              html.text("24"),
            ],
          ),
          html.td(
            [
              attribute.class(
                "pr-0 p-4 align-middle text-outline lg:table-cell hidden",
              ),
            ],
            [
              html.time([attribute.datetime("2025-01-10")], [
                html.text("2 days ago"),
              ]),
            ],
          ),
        ],
      )
    })

  case page.next_cursor {
    None -> rows
    Some(cursor) -> {
      let next_url =
        "/exercises?cursor="
        <> int.to_string(cursor)
        <> case string.is_empty(query) {
          True -> ""
          False -> "&q=" <> query
        }
      let sentinel =
        html.tr(
          [
            attribute.attribute("hx-get", next_url),
            attribute.attribute("hx-swap", "outerHTML"),
            attribute.attribute("hx-trigger", "revealed"),
          ],
          [
            html.td(
              [
                attribute.attribute("colspan", "4"),
                attribute.class("py-4 text-center text-outline text-sm"),
              ],
              [html.text("loading more...")],
            ),
          ],
        )
      list.append(rows, [sentinel])
    }
  }
}

pub fn exercises_page(children: Element(a), req: Request) -> Element(a) {
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
