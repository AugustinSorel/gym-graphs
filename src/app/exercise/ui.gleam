import app/auth_session/auth_session
import app/exercise/exercise
import app/exercise/sql as exercise_sql
import app/one_rep_max
import app/tag/sql as tag_sql
import app/ui
import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/order
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
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

pub fn new_exercise_form(
  f: Form(NewExerciseForm),
  tags: List(tag_sql.SelectByUserIdRow),
) -> Element(a) {
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
      tag_checkboxes(tags),
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

fn tag_checkboxes(tags: List(tag_sql.SelectByUserIdRow)) -> Element(a) {
  use <- bool.guard(when: tags == [], return: element.none())

  html.fieldset([attribute.class("grid gap-3")], [
    html.legend([attribute.class("text-outline text-sm mb-3")], [
      html.text("tags:"),
    ]),
    html.div(
      [attribute.class("flex flex-wrap gap-2")],
      list.map(tags, fn(tag) {
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
              attribute.value(int.to_string(tag.id)),
              attribute.class("sr-only"),
            ]),
            html.text(tag.name),
          ],
        )
      }),
    ),
  ])
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
  user: auth_session.User,
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
      element.fragment(exercises_row_tbodies(page, query, user)),
    ]),
  ])
}

pub fn exercises_list_error(error: String) -> Element(a) {
  ui.alert(ui.AlertError, [], [
    ui.alert_title(element.text("listing exercises failed")),
    ui.alert_description(element.text(error)),
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

pub fn exercises_rows(
  page: exercise.Page,
  query: String,
  user: auth_session.User,
) -> Element(a) {
  element.fragment(exercises_row_tbodies(page, query, user))
}

fn exercises_row_tbodies(
  page: exercise.Page,
  query: String,
  user: auth_session.User,
) -> List(Element(a)) {
  use <- bool.guard(when: page.rows == [], return: [
    html.tbody([], [
      html.tr([], [
        html.td(
          [
            attribute.attribute("colspan", "4"),
            attribute.class("px-4 py-10 text-center text-outline"),
          ],
          [no_exercises_found()],
        ),
      ]),
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
          last_one_rep_max_cell(ex, user.one_rep_max_algorithm),
          html.td(
            [
              attribute.class(
                "p-4 align-middle text-outline lg:table-cell hidden",
              ),
            ],
            [
              html.text(case ex.sets_count {
                Some(n) if n > 0 -> int.to_string(n)
                _ -> "-"
              }),
            ],
          ),
          html.td(
            [
              attribute.class(
                "pr-0 p-4 align-middle text-outline lg:table-cell hidden",
              ),
            ],
            [
              case ex.last_set_at {
                Some(ts) -> html.text(time_ago(ts))
                None -> html.text("-")
              },
            ],
          ),
        ],
      )
    })

  let rows_tbody = html.tbody([], rows)

  case page.next_cursor {
    None -> [rows_tbody]
    Some(cursor) -> {
      let next_url =
        "/exercises?cursor="
        <> int.to_string(cursor)
        <> case string.is_empty(query) {
          True -> ""
          False -> "&q=" <> query
        }
      let skeleton_rows =
        list.repeat(
          html.tr([], [
            html.td(
              [
                attribute.attribute("colspan", "4"),
                attribute.class(
                  "animate-pulse h-13 bg-[radial-gradient(circle,color-mix(in_srgb,var(--outline)_50%,transparent)_30%,transparent_40%)] bg-bottom bg-[size:4px_2px] bg-repeat-x ",
                ),
              ],
              [],
            ),
          ]),
          20,
        )
      let skeleton_tbody =
        html.tbody(
          [
            attribute.attribute("hx-get", next_url),
            attribute.attribute("hx-swap", "outerHTML"),
            attribute.attribute("hx-trigger", "revealed"),
          ],
          skeleton_rows,
        )
      [rows_tbody, skeleton_tbody]
    }
  }
}

fn last_one_rep_max_cell(
  ex: exercise_sql.SelectPageByUserIdRow,
  algo: one_rep_max.Algorithm,
) {
  case ex.last_reps, ex.last_weight_in_g {
    Some(reps), Some(weight_in_g) -> {
      let orm =
        one_rep_max.calculate(algo:, weight: weight_in_g, repetitions: reps)
      let trend = case ex.prev_reps, ex.prev_weight_in_g {
        Some(prev_reps), Some(prev_weight_in_g) -> {
          let prev_orm = {
            one_rep_max.calculate(
              algo,
              weight: prev_weight_in_g,
              repetitions: prev_reps,
            )
          }
          case float.compare(prev_orm, orm) {
            order.Gt ->
              html.span(
                [
                  attribute.aria_label("up"),
                ],
                [html.text(" ↑")],
              )
            order.Lt ->
              html.span(
                [
                  attribute.aria_label("down"),
                ],
                [html.text(" ↓")],
              )
            order.Eq -> html.text(" -")
          }
        }
        _, _ -> html.text("-")
      }
      html.td(
        [
          attribute.class(
            "p-4 pr-0 lg:pr-4 align-middle text-outline text-right lg:text-left",
          ),
        ],
        [
          html.text(float.to_string(float.to_precision(orm /. 1000.0, 3))),
          html.abbr(
            [
              attribute.title("kilograms"),
              attribute.class("no-underline"),
            ],
            [html.text("kg")],
          ),
          trend,
        ],
      )
    }
    _, _ ->
      html.td(
        [
          attribute.class(
            "p-4 pr-0 lg:pr-4 align-middle text-outline text-right lg:text-left",
          ),
        ],
        [html.text("-")],
      )
  }
}

fn time_ago(ts: timestamp.Timestamp) -> String {
  let now = timestamp.system_time()
  let diff = timestamp.difference(ts, now)
  let secs = duration.to_seconds(diff) |> float.round()

  case secs {
    s if s < 60 -> "just now"
    s if s < 3600 -> {
      let mins = s / 60
      case mins {
        1 -> "1 minute ago"
        _ -> int.to_string(mins) <> " minutes ago"
      }
    }
    s if s < 86_400 -> {
      let hours = s / 3600
      case hours {
        1 -> "1 hour ago"
        _ -> int.to_string(hours) <> " hours ago"
      }
    }
    s if s < 2_592_000 -> {
      let days = s / 86_400
      case days {
        1 -> "yesterday"
        _ -> int.to_string(days) <> " days ago"
      }
    }
    s if s < 31_536_000 -> {
      let months = s / 2_592_000
      case months {
        1 -> "1 month ago"
        _ -> int.to_string(months) <> " months ago"
      }
    }
    s -> {
      let years = s / 31_536_000
      case years {
        1 -> "1 year ago"
        _ -> int.to_string(years) <> " years ago"
      }
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

pub type RenameExerciseForm {
  RenameExerciseForm(name: String)
}

pub fn get_rename_exercise_form() -> Form(RenameExerciseForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(RenameExerciseForm(name:))
  }

  form.new(schema)
}

pub fn rename_exercise_form(f: Form(RenameExerciseForm), id: String) {
  let name_err = list.first(form.field_error_messages(f, "name"))
  let root_err = list.first(form.field_error_messages(f, "root"))

  html.form(
    [
      attribute.attribute("hx-patch", "/exercises/" <> id <> "/name"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.label([attribute.class("grid gap-2")], [
        html.span([attribute.class("text-outline text-sm")], [
          html.text("name:"),
        ]),
        ui.input([
          attribute.type_("text"),
          attribute.name("name"),
          attribute.value(form.field_value(f, "name")),
          attribute.attribute("autocomplete", "off"),
          attribute.attribute("autofocus", ""),
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
      ]),
      case root_err {
        Ok(msg) ->
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("Renaming exercise failed")),
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

pub fn rename_exercise_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [children],
    ),
  ])
}

pub fn exercise_detail_page(
  ex: exercise_sql.SelectByIdAndUserIdRow,
  stats: exercise_sql.SelectStatsByExerciseIdRow,
  user: auth_session.User,
  req: Request,
) -> Element(a) {
  let best_1rm_value = case stats.best_1rm_weight_in_g, stats.best_1rm_reps {
    Some(w), Some(r) -> {
      let orm = one_rep_max.calculate(user.one_rep_max_algorithm, weight: w, repetitions: r)
      float.to_string(float.to_precision(orm /. 1000.0, 3)) <> "kg"
    }
    _, _ -> "-"
  }

  let max_weight_value = case stats.max_weight_in_g {
    Some(w) -> float.to_string(float.to_precision(int.to_float(w) /. 1000.0, 3)) <> "kg"
    None -> "-"
  }

  let total_volume_value = case stats.total_volume_in_g {
    Some(v) -> float.to_string(float.to_precision(int.to_float(v) /. 1000.0, 1)) <> "kg"
    None -> "-"
  }

  let total_sets_value = case stats.total_sets {
    Some(n) -> int.to_string(n)
    None -> "-"
  }

  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1(
          [attribute.class("text-3xl font-semibold capitalize")],
          [html.text(ex.name)],
        ),
        html.div(
          [attribute.class("grid grid-cols-2 lg:grid-cols-4 gap-3")],
          [
            stat_square("best 1rm", best_1rm_value),
            stat_square("highest weight", max_weight_value),
            stat_square("total volume", total_volume_value),
            stat_square("total sets", total_sets_value),
          ],
        ),
      ],
    ),
  ])
}

fn stat_square(label: String, value: String) -> Element(a) {
  html.div(
    [
      attribute.class(
        "border-2 border-on-surface/20 p-4 flex flex-col gap-1",
      ),
    ],
    [
      html.span(
        [attribute.class("text-outline text-xs uppercase tracking-wide")],
        [html.text(label)],
      ),
      html.span(
        [attribute.class("text-xl font-semibold tabular-nums")],
        [html.text(value)],
      ),
    ],
  )
}

pub fn remove_exercise_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 max-w-3xl mx-auto my-10 lg:my-20 text-center",
        ),
      ],
      [
        html.h1([attribute.class("capitalize font-semibold text-3xl")], [
          html.text("remove exercise"),
        ]),
        children,
        ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
          html.text("cancel"),
        ]),
      ],
    ),
  ])
}

pub fn remove_exercise_alert(msg: String) -> Element(a) {
  ui.alert(ui.AlertError, [], [
    ui.alert_title(element.text("Removing exercise failed")),
    ui.alert_description(element.text(msg)),
  ])
}

pub fn remove_exercise_dialog(
  ex: exercise_sql.SelectByIdAndUserIdRow,
) -> Element(a) {
  element.fragment([
    html.p([attribute.class("text-outline text-balance")], [
      html.text(
        "are you sure you want to remove the exercise \""
        <> ex.name
        <> "\"? This action cannot be undone.",
      ),
    ]),
    ui.button(
      ui.ButtonDestroy,
      [
        attribute.attribute("hx-delete", "/exercises/" <> int.to_string(ex.id)),
        attribute.attribute("hx-disable", "this"),
      ],
      [html.text("yes remove exercise"), ui.spinner()],
    ),
  ])
}
