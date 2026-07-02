import app/exercise/sql
import app/ui
import formal/form.{type Form}
import gleam/int
import gleam/list
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
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto m-20",
        ),
      ],
      [
        children,
      ],
    ),
  ])
}

pub fn exercises_list(exercises: List(sql.SelectByUserIdRow)) -> Element(a) {
  html.section([], [
    html.header([attribute.class("flex items-center justify-between mb-6")], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 grow",
          ),
        ],
        [html.text("exercises")],
      ),
      ui.button_link(ui.ButtonPrimary, [attribute.href("/exercises/new")], [
        html.text("new exercise"),
      ]),
    ]),
    case exercises {
      [] ->
        html.p([attribute.class("text-outline text-sm py-7")], [
          html.text("no exercises yet."),
        ])
      _ ->
        html.ul(
          [],
          list.map(exercises, fn(ex) {
            html.li(
              [
                attribute.class(
                  "grid grid-cols-[1fr_auto] items-center py-7 border-b-2 border-outline gap-3",
                ),
              ],
              [
                html.span([], [html.text(ex.name)]),
                ui.link(
                  [attribute.href("/exercises/" <> int.to_string(ex.id))],
                  [html.text("view")],
                ),
              ],
            )
          }),
        )
    },
  ])
}

pub fn exercises_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto m-20",
        ),
      ],
      [children],
    ),
  ])
}
