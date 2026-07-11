import app/auth_session/auth_session
import app/exercise/exercise
import app/exercise/sql as exercise_sql
import app/one_rep_max
import app/tag/sql as tag_sql
import app/ui
import app/user/user
import chart/axis
import chart/line
import chart/scale
import formal/form.{type Form}
import gleam/bool
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/order
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
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
          last_one_rep_max_cell(
            ex,
            user.one_rep_max_algorithm,
            user.weight_unit,
          ),
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
  weight_unit: user.WeightUnit,
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
          case float.compare(orm, prev_orm) {
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
        _, _ -> html.text(" -")
      }
      let orm_in_g = float.round(orm)
      let #(value_str, unit_abbr) = ui.display_weight(orm_in_g, weight_unit)
      html.td(
        [
          attribute.class(
            "p-4 pr-0 lg:pr-4 align-middle text-outline text-right lg:text-left",
          ),
        ],
        [
          html.text(value_str),
          unit_abbr,
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
      let orm =
        one_rep_max.calculate(
          user.one_rep_max_algorithm,
          weight: w,
          repetitions: r,
        )
      let #(value_str, unit_abbr) =
        ui.display_weight(float.round(orm), user.weight_unit)
      [html.text(value_str), unit_abbr]
    }
    _, _ -> [html.text("-")]
  }

  let max_weight_value = case stats.max_weight_in_g {
    Some(w) -> {
      let #(value_str, unit_abbr) = ui.display_weight(w, user.weight_unit)
      [html.text(value_str), unit_abbr]
    }
    None -> [html.text("-")]
  }

  let total_volume_value = case stats.total_volume_in_g {
    Some(v) -> {
      let #(value_str, unit_abbr) = ui.display_weight(v, user.weight_unit)
      [html.text(value_str), unit_abbr]
    }
    None -> [html.text("-")]
  }

  let total_sets_value = case stats.total_sets {
    Some(n) -> [html.text(int.to_string(n))]
    None -> [html.text("-")]
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
        html.h1([attribute.class("text-3xl font-semibold capitalize")], [
          html.text(ex.name),
        ]),
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
              html.div([attribute.class("grid gap-1")], [
                html.dt([attribute.class("text-outline text-xs")], [
                  html.text("best 1"),
                  html.abbr(
                    [
                      attribute.title("repetition maximum"),
                      attribute.class("no-underline"),
                    ],
                    [
                      html.text("rm"),
                    ],
                  ),
                ]),
                html.dd(
                  [attribute.class("text-xl font-semibold")],
                  best_1rm_value,
                ),
              ]),
              html.div([], [
                html.dt([attribute.class("text-outline text-xs")], [
                  html.text("highest weight"),
                ]),
                html.dd(
                  [attribute.class("text-xl font-semibold")],
                  max_weight_value,
                ),
              ]),
              html.div([], [
                html.dt([attribute.class("text-outline text-xs")], [
                  html.text("total volume"),
                ]),
                html.dd(
                  [attribute.class("text-xl font-semibold")],
                  total_volume_value,
                ),
              ]),
              html.div([], [
                html.dt([attribute.class("text-outline text-xs")], [
                  html.text("total sets"),
                ]),
                html.dd(
                  [attribute.class("text-xl font-semibold")],
                  total_sets_value,
                ),
              ]),
            ],
          ),
        ]),
        html.section([attribute.class("flex flex-col gap-4")], [
          html.h2(
            [
              attribute.class(
                "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
              ),
            ],
            [
              html.text("1"),
              html.abbr(
                [
                  attribute.title("repetition maximum"),
                  attribute.class("no-underline"),
                ],
                [html.text("rm")],
              ),
              html.text(" over time"),
            ],
          ),
          html.div(
            [
              attribute.attribute("data-graph-container", ""),
              attribute.attribute(
                "hx-get",
                "/exercises/" <> int.to_string(ex.id) <> "/one-rep-max.svg",
              ),
              attribute.attribute("hx-trigger", "graph-resize"),
              attribute.attribute("hx-swap", "innerHTML"),
              attribute.class("h-[200px]"),
            ],
            [],
          ),
        ]),
      ],
    ),
  ])
}

/// Renders an SVG line graph of 1RM over time.
/// x is the ordinal set index (1, 2, 3…), y is the computed 1RM value.
/// Uses mock data until real per-set history is wired up.
pub fn one_rep_max_graph(
  width width: Int,
  height height: Int,
  algorithm algorithm: one_rep_max.Algorithm,
  weight_unit weight_unit: user.WeightUnit,
) -> Element(a) {
  // Mock data: #(ordinal_index, #(reps, weight_in_g)) for each logged set
  let mock_sets = [
    #(1, #(5, 80_000)),
    #(2, #(3, 85_000)),
    #(3, #(8, 75_000)),
    #(4, #(1, 90_000)),
    #(5, #(5, 87_500)),
    #(6, #(3, 92_500)),
    #(7, #(6, 87_500)),
    #(8, #(1, 95_000)),
    #(9, #(4, 92_500)),
    #(10, #(2, 97_500)),
    #(11, #(5, 92_500)),
    #(12, #(1, 100_000)),
  ]

  let padding_top = 12.0
  let padding_bottom = 28.0

  let w = int.to_float(width)
  let h = int.to_float(height)

  // Compute 1RM for each set
  let orm_points =
    list.map(mock_sets, fn(entry) {
      let #(idx, #(reps, weight_in_g)) = entry
      let orm =
        one_rep_max.calculate(algorithm, weight: weight_in_g, repetitions: reps)
      #(int.to_float(idx), orm)
    })

  let xs = list.map(orm_points, fn(p) { p.0 })
  let ys = list.map(orm_points, fn(p) { p.1 })

  let min_x = list.reduce(xs, float.min) |> result.unwrap(1.0)
  let max_x = list.reduce(xs, float.max) |> result.unwrap(1.0)
  let min_y = list.reduce(ys, float.min) |> result.unwrap(0.0)
  let max_y = list.reduce(ys, float.max) |> result.unwrap(0.0)

  let y_domain = #(float.max(0.0, min_y), max_y)
  let x_domain = #(min_x, max_x)

  // Both formatters defined early so we can measure labels before committing
  // to padding values.  SVG has no server-side text measurement, so we use a
  // conservative per-character estimate at font-size 10 (≈ 6 px/char).
  let char_width_estimate = 6.0

  let y_format = fn(v: Float) -> String {
    let #(value_str, _unit_el) = ui.display_weight(float.round(v), weight_unit)
    let unit_str = case weight_unit {
      user.Kg -> "kg"
      user.Lbs -> "lbs"
    }
    value_str <> unit_str
  }

  let x_tick_count = 3
  let x_format = fn(v: Float) -> String {
    "set " <> int.to_string(float.round(v))
  }

  // padding_left: tick mark (4) + gap (4) + widest y label
  let y_tick_count = 3
  let y_label_fixed_overhead = 8.0
  let padding_left =
    axis.new(axis.Left, fn(v) { v }, y_domain)
    |> axis.ticks(y_tick_count)
    |> axis.format(y_format)
    |> axis.to_ticks
    |> list.map(fn(t) { string.length(t.label) })
    |> list.reduce(int.max)
    |> result.unwrap(0)
    |> int.to_float
    |> fn(chars) { chars *. char_width_estimate +. y_label_fixed_overhead }

  // padding_right / extra padding_left: x-axis labels are centred on their
  // tick, so the first and last labels each overflow by half their own width.
  // We measure the widest x label and reserve that much on each side.
  let x_half_label_width =
    axis.new(axis.Bottom, fn(v) { v }, x_domain)
    |> axis.ticks(x_tick_count)
    |> axis.format(x_format)
    |> axis.to_ticks
    |> list.map(fn(t) { string.length(t.label) })
    |> list.reduce(int.max)
    |> result.unwrap(0)
    |> int.to_float
    |> fn(chars) { chars *. char_width_estimate /. 2.0 }

  let padding_left = float.max(padding_left, x_half_label_width)
  let padding_right = x_half_label_width

  // Inner chart dimensions (the plot area, without padding)
  let inner_w = w -. padding_left -. padding_right
  let inner_h = h -. padding_top -. padding_bottom

  // Scales — both expressed in inner-plot coordinates (0,0 = top-left of plot)
  let scale_x = scale.linear(domain: x_domain, range: #(0.0, inner_w))
  let scale_y = scale.linear(domain: y_domain, range: #(inner_h, 0.0))

  let path_d =
    orm_points
    |> line.new()
    |> line.x(fn(d) { scale_x(d.0) })
    |> line.y(fn(d) { scale_y(d.1) })
    |> line.curve(line.MonotoneX)
    |> line.to_path

  let final_dot =
    list.last(orm_points)
    |> result.map(fn(point) {
      let #(x, y) = point
      svg.circle([
        attribute.attribute("cx", float.to_string(scale_x(x))),
        attribute.attribute("cy", float.to_string(scale_y(y))),
        attribute.attribute("r", "4"),
        attribute.class("fill-on-surface stroke-surface stroke-2"),
      ])
    })
    |> result.unwrap(element.none())

  // Y axis ticks — grid lines extend rightward across the full inner width
  let y_ticks =
    axis.new(axis.Left, scale_y, y_domain)
    |> axis.ticks(y_tick_count)
    |> axis.format(y_format)
    |> axis.grid(inner_w)
    |> axis.to_ticks

  let y_axis_elements =
    list.flat_map(y_ticks, fn(t) {
      let py = float.to_string(t.position)
      let grid = case t.grid_length >. 0.0 {
        False -> []
        True -> [
          svg.line([
            attribute.attribute("x1", "0"),
            attribute.attribute("y1", py),
            attribute.attribute("x2", float.to_string(t.grid_length)),
            attribute.attribute("y2", py),
            attribute.class("stroke-outline/20"),
            attribute.attribute("stroke-width", "1"),
          ]),
        ]
      }
      let tick_end = float.to_string(0.0 -. t.tick_length)
      let label_x = float.to_string(0.0 -. t.tick_length -. t.label_offset)
      list.flatten([
        grid,
        [
          svg.line([
            attribute.attribute("x1", tick_end),
            attribute.attribute("y1", py),
            attribute.attribute("x2", "0"),
            attribute.attribute("y2", py),
            attribute.class("stroke-outline"),
            attribute.attribute("stroke-width", "1"),
          ]),
          svg.text(
            [
              attribute.attribute("x", label_x),
              attribute.attribute("y", py),
              attribute.attribute("text-anchor", "end"),
              attribute.attribute("dominant-baseline", "middle"),
              attribute.attribute("font-size", "10"),
              attribute.class("fill-outline"),
            ],
            t.label,
          ),
        ],
      ])
    })

  // X axis ticks — no grid lines, labels sit below the axis line
  let x_ticks =
    axis.new(axis.Bottom, scale_x, x_domain)
    |> axis.ticks(x_tick_count)
    |> axis.format(x_format)
    |> axis.to_ticks

  let x_axis_elements =
    list.flat_map(x_ticks, fn(t) {
      let px = float.to_string(t.position)
      let label_y = float.to_string(t.tick_length +. t.label_offset)
      [
        svg.line([
          attribute.attribute("x1", px),
          attribute.attribute("y1", "0"),
          attribute.attribute("x2", px),
          attribute.attribute("y2", float.to_string(t.tick_length)),
          attribute.class("stroke-outline"),
          attribute.attribute("stroke-width", "1"),
        ]),
        svg.text(
          [
            attribute.attribute("x", px),
            attribute.attribute("y", label_y),
            attribute.attribute("text-anchor", "middle"),
            attribute.attribute("dominant-baseline", "hanging"),
            attribute.attribute("font-size", "10"),
            attribute.class("fill-outline"),
          ],
          t.label,
        ),
      ]
    })

  svg.svg(
    [
      attribute.attribute("width", int.to_string(width)),
      attribute.attribute("height", int.to_string(height)),
      attribute.attribute("aria-label", "one rep max over time"),
    ],
    [
      svg.g(
        [
          attribute.attribute(
            "transform",
            "translate("
              <> float.to_string(padding_left)
              <> ","
              <> float.to_string(padding_top)
              <> ")",
          ),
        ],
        list.flatten([
          y_axis_elements,
          [
            svg.path([
              attribute.attribute("d", path_d),
              attribute.class("stroke-on-surface fill-none stroke-2"),
              attribute.attribute("stroke-linejoin", "round"),
              attribute.attribute("stroke-linecap", "round"),
            ]),
          ],
          [final_dot],
          [
            svg.g(
              [
                attribute.attribute(
                  "transform",
                  "translate(0," <> float.to_string(inner_h) <> ")",
                ),
              ],
              x_axis_elements,
            ),
          ],
        ]),
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
