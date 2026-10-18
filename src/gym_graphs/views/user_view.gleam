import formal/form.{type Form}
import gleam/bool
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/domains/user.{type User, type WeightUnit}
import gym_graphs/schemas/user_schema.{type EditNameSchema}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn account_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
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

pub fn edit_name_page(
  children: Element(a),
  path: String,
  name: String,
) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.div([attribute.class("flex flex-col items-center gap-2 mb-4")], [
          html.span(
            [
              attribute.id("edit-name-avatar"),
              attribute.class(
                "uppercase size-16 text-xl bg-on-surface text-surface flex items-center justify-center font-semibold",
              ),
              attribute.aria_hidden(True),
            ],
            [html.text(name_initials(name))],
          ),
          html.span(
            [attribute.class("text-outline text-xs uppercase tracking-widest")],
            [html.text("preview")],
          ),
        ]),
        children,
      ],
    ),
  ])
}

pub fn name_initials(name: String) -> String {
  let name = string.trim(name)

  case string.length(name) {
    0 -> "??"
    1 -> string.uppercase(name)
    _ -> string.uppercase(string.slice(from: name, at_index: 0, length: 2))
  }
}

pub fn edit_name_form(form: Form(EditNameSchema)) -> Element(a) {
  let name_error = list.first(form.field_error_messages(form, "name"))
  let root_error = list.first(form.field_error_messages(form, "root"))

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
        [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("display name"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(form, "name")),
            attribute.autocomplete("name"),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(name_error))),
            ),
            attribute.attribute(
              "oninput",
              "var v = this.value.trim(); var a = document.getElementById('edit-name-avatar'); if (!a) return; if (v.length >= 2) { a.textContent = v.slice(0, 2).toUpperCase(); } else if (v.length === 1) { a.textContent = v.toUpperCase(); } else { a.textContent = '??'; }",
            ),
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
            ui.alert_description(element.text(message)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("save"),
        ui.spinner(),
      ]),
      ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn account_details(
  user: User,
  // tags: List(tag_sql.SelectByUserIdRow),
) -> Element(a) {
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
          html.text(string.slice(from: user.name.value, at_index: 0, length: 2)),
        ],
      ),
      html.h1(
        [
          attribute.class("capitalize font-semibold text-3xl break-all"),
        ],
        [html.text(user.name.value)],
      ),
      html.p(
        [
          attribute.class("text-sm text-outline break-all"),
        ],
        [html.text(user.email.value)],
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
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-dotted border-outline/50",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("email"),
            ]),
            html.dd([attribute.class("break-all")], [
              html.text(user.email.value),
            ]),
          ]),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("name"),
            ]),
            html.dd([attribute.class("capitalize break-all")], [
              html.text(user.name.value),
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
      update_password_row(error: option.None),
      sign_out_row(error: option.None),
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
      weight_unit_form(
        user_schema.weight_unit()
        |> form.add_values([
          #("weight_unit", user.weight_unit |> user.weight_unit_to_string()),
        ]),
      ),
      html.div(
        [
          attribute.class(
            "py-7 border-b-2 border-outline/50 border-dotted flex items-center justify-between",
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
      remove_account_row(error: option.None),
    ]),
  ])
}

pub fn weight_unit_form(form: Form(WeightUnit)) -> Element(a) {
  let error =
    list.append(
      form.field_error_messages(form, "weight_unit"),
      form.field_error_messages(form, "root"),
    )
    |> list.first()

  html.form(
    [
      attribute.attribute("hx-patch", "/account/weight-unit"),
      attribute.attribute("hx-trigger", "change"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class(
        "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
      ),
    ],
    [
      html.p([attribute.class("text-outline text-sm")], [
        html.text("weight unit"),
      ]),
      html.fieldset([attribute.class("flex border-2 border-on-surface w-fit")], [
        weight_unit_option(form, "kg", "kilograms"),
        weight_unit_option(form, "lbs", "pounds"),
      ]),
      case error {
        Ok(message) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("changing weight unit failed")),
            ui.alert_description(element.text(message)),
          ])
        Error(_) -> element.none()
      },
    ],
  )
}

fn weight_unit_option(form: Form(WeightUnit), value: String, title: String) {
  html.label(
    [
      attribute.class(
        "px-5 py-2 text-sm font-semibold uppercase cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
      ),
    ],
    [
      html.input([
        attribute.type_("radio"),
        attribute.name("weight_unit"),
        attribute.value(value),
        attribute.checked(form.field_value(form, "weight_unit") == value),
        attribute.class("sr-only"),
      ]),
      html.abbr([attribute.title(title), attribute.class("no-underline")], [
        html.text(value),
      ]),
    ],
  )
}

pub fn update_password_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
      ),
    ],
    [
      html.dl([attribute.class("space-y-1")], [
        html.dt([attribute.class("text-outline text-sm")], [
          html.text("password"),
        ]),
        html.dd([attribute.class("break-all")], [html.text("***********")]),
      ]),
      ui.button(
        ui.ButtonPrimary,
        [
          attribute.attribute("hx-post", "/update-password"),
          attribute.attribute("hx-disable", "this"),
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
          attribute.class("my-auto text-sm"),
        ],
        [html.text("update"), ui.spinner()],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("updating password failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

pub fn sign_out_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
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
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
          attribute.class("my-auto ml-auto"),
        ],
        [
          html.text("sign out"),
          ui.spinner(),
        ],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("signing out failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

pub fn remove_account_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
      ),
    ],
    [
      html.div([attribute.class("space-y-1")], [
        html.p([attribute.class("text-outline text-sm")], [
          html.text("remove account"),
        ]),
        html.p([attribute.class("text-balance")], [
          html.text("remove your account from all of our servers."),
        ]),
      ]),
      ui.button(
        ui.ButtonDestroy,
        [
          attribute.attribute("hx-post", "/delete-account"),
          attribute.attribute("hx-disable", "this"),
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
          attribute.class("my-auto ml-auto"),
        ],
        [
          html.text("delete account"),
          ui.spinner(),
        ],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("deleting account failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}
