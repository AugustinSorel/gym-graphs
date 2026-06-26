import app/auth_session/auth_session.{type User}
import app/ui
import formal/form.{type Form}
import gleam/list
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request}

pub fn edit_name_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto m-20",
        ),
      ],
      [
        html.header([], [
          ui.link([attribute.href("/account")], [html.text("<- back")]),
        ]),
        children,
      ],
    ),
  ])
}

pub type EditNameForm {
  EditNameForm(name: String)
}

pub fn edit_name_form(f: Form(EditNameForm)) -> Element(a) {
  let name_err = list.first(form.field_error_messages(f, "name"))
  let root_err = list.first(form.field_error_messages(f, "root"))

  html.form(
    [
      attribute.attribute("hx-patch", "/account/name"),
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
          html.span([attribute.class("text-outline text-sm uppercase")], [
            html.text("new name:"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(f, "name")),
            attribute.attribute("autocomplete", "name"),
            attribute.class("text-5xl"),
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
          ui.alert([
            ui.alert_title(element.text("something went wrong")),
            ui.alert_description(element.text(msg)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
    ],
  )
}

pub fn get_edit_name_form() -> Form(EditNameForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(EditNameForm(name:))
  }

  form.new(schema)
}

pub fn account_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          " flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto m-20",
        ),
      ],
      [children],
    ),
  ])
}

pub fn account_details(user: User) -> Element(a) {
  element.fragment([
    html.header([attribute.class("space-y-1")], [
      html.span(
        [
          attribute.class(
            "uppercase size-16 mb-5 text-xl bg-on-surface text-surface flex items-center justify-center font-semibold row-span-2",
          ),
          attribute.aria_hidden(True),
        ],
        [
          html.text(string.slice(from: user.name, at_index: 0, length: 2)),
        ],
      ),
      html.h1(
        [
          attribute.class("capitalize font-semibold text-3xl break-all"),
        ],
        [html.text(user.name)],
      ),
      html.p(
        [
          attribute.class("text-sm text-outline break-all"),
        ],
        [html.text(user.email)],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("profile"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("email"),
            ]),
            html.dd([attribute.class("break-all")], [
              html.text(user.email),
            ]),
          ]),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline gap-3",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("name"),
            ]),
            html.dd([attribute.class("capitalize break-all")], [
              html.text(user.name),
            ]),
          ]),
          ui.link(
            [
              attribute.href("/account/name"),
              attribute.class("my-auto text-sm"),
            ],
            [html.text("edit")],
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline gap-3",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("your data"),
            ]),
            html.dd([attribute.class("break-all")], [
              html.text("download your data"),
            ]),
          ]),
          ui.button(
            ui.ButtonPrimary,
            [
              attribute.attribute("hx-post", "#"),
              attribute.attribute("hx-disable", "this"),
              attribute.class("my-auto"),
            ],
            [
              html.text("download"),
              ui.spinner(),
            ],
          ),
        ],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("security"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline gap-3",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("password"),
            ]),
            html.dd([attribute.class("break-all")], [html.text("***********")]),
          ]),
          ui.link(
            [
              attribute.href("/account/edit/name"),
              attribute.class("my-auto text-sm"),
            ],
            [html.text("edit")],
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid lg:grid-cols-[1fr_auto] py-7 border-b-2 border-outline gap-3",
          ),
        ],
        [
          html.div([attribute.class("space-y-1")], [
            html.p([attribute.class("text-outline text-sm")], [
              html.text("session"),
            ]),
            html.p([attribute.class("text-balance")], [
              html.text("sign out from this current device."),
            ]),
          ]),
          ui.button(
            ui.ButtonPrimary,
            [
              attribute.attribute("hx-post", "/sign-out"),
              attribute.attribute("hx-disable", "this"),
              attribute.class("my-auto ml-auto"),
            ],
            [
              html.text("sign out"),
              ui.spinner(),
            ],
          ),
        ],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("preferences"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "py-7 border-b-2 border-outline flex justify-between items-center",
          ),
        ],
        [
          html.p([attribute.class("text-outline text-sm")], [
            html.text("weight unit"),
          ]),
          html.fieldset(
            [attribute.class("flex border-2 border-on-surface w-fit")],
            [
              html.input([
                attribute.type_("radio"),
                attribute.name("weight_unit"),
                attribute.value("kg"),
                attribute.id("unit-kg"),
                attribute.checked(True),
                attribute.class("sr-only peer/kg"),
              ]),
              html.label(
                [
                  attribute.for("unit-kg"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer border-r-2 border-on-surface peer-checked/kg:bg-on-surface peer-checked/kg:text-surface peer-[:not(:checked)]/kg:hover:bg-on-surface/10 transition-colors peer-focus-visible/kg:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("kg")],
              ),
              html.input([
                attribute.type_("radio"),
                attribute.name("weight_unit"),
                attribute.value("lbs"),
                attribute.id("unit-lbs"),
                attribute.class("sr-only peer/lbs"),
              ]),
              html.label(
                [
                  attribute.for("unit-lbs"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer peer-checked/lbs:bg-on-surface peer-checked/lbs:text-surface peer-[:not(:checked)]/lbs:hover:bg-on-surface/10 transition-colors peer-focus-visible/lbs:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("lbs")],
              ),
            ],
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "py-7 border-b-2 border-outline space-y-3 flex items-center justify-between",
          ),
        ],
        [
          html.p([attribute.class("text-outline text-sm")], [
            html.text("theme"),
          ]),
          html.fieldset(
            [attribute.class("flex border-2 border-on-surface w-fit")],
            [
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("system"),
                attribute.id("theme-system"),
                attribute.checked(True),
                attribute.class("sr-only peer/system"),
              ]),
              html.label(
                [
                  attribute.for("theme-system"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer border-r-2 border-on-surface peer-checked/system:bg-on-surface peer-checked/system:text-surface peer-[:not(:checked)]/system:hover:bg-on-surface/10 transition-colors peer-focus-visible/system:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("system")],
              ),
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("light"),
                attribute.id("theme-light"),
                attribute.class("sr-only peer/light"),
              ]),
              html.label(
                [
                  attribute.for("theme-light"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer border-r-2 border-on-surface peer-checked/light:bg-on-surface peer-checked/light:text-surface peer-[:not(:checked)]/light:hover:bg-on-surface/10  transition-colors peer-focus-visible/light:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("light")],
              ),
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("dark"),
                attribute.id("theme-dark"),
                attribute.class("sr-only peer/dark"),
              ]),
              html.label(
                [
                  attribute.for("theme-dark"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer peer-checked/dark:bg-on-surface peer-checked/dark:text-surface peer-[:not(:checked)]/dark:hover:bg-on-surface/10 transition-colors peer-focus-visible/dark:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("dark")],
              ),
            ],
          ),
        ],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("danger zone"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid lg:grid-cols-[1fr_auto] py-7 border-b-2 border-outline gap-3",
          ),
        ],
        [
          html.div([attribute.class("space-y-1")], [
            html.p([attribute.class("text-outline text-sm")], [
              html.text("remove account"),
            ]),
            html.p([], [
              html.text("remove your account from all of our servers."),
            ]),
          ]),
          ui.button(
            ui.ButtonDestroy,
            [
              attribute.attribute("hx-post", "/delete-account"),
              attribute.attribute("hx-disable", "this"),
              attribute.class("my-auto ml-auto"),
            ],
            [
              html.text("delete account"),
              ui.spinner(),
            ],
          ),
        ],
      ),
    ]),
  ])
}
