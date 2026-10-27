import formal/form.{type Form}
import gleam/bool
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import gym_graphs/domains/tag.{type Tag, type TagId}
import gym_graphs/schemas/tag_schema.{type CreateTagSchema, type RenameTagSchema}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn create_tag_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.div([attribute.class("flex flex-col mx-auto w-full gap-20")], [
          children,
        ]),
      ],
    ),
  ])
}

pub fn create_tag_form(form: Form(CreateTagSchema)) -> Element(a) {
  let name_error = list.first(form.field_error_messages(form, "name"))
  let root_error = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/tags/new"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.h1([attribute.class("font-semibold text-3xl")], [
        html.text("create exercise tag"),
      ]),
      html.label(
        [attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error")],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("tag name"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(form, "name")),
            attribute.placeholder("e.g. legs, push, cardio"),
            attribute.autocomplete("off"),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(name_error))),
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
            ui.alert_description([], element.text(message)),
          ])
        Error(_) -> element.none()
      },
      ui.button(ui.ButtonPrimary, [attribute.type_("submit")], [
        html.text("create tag"),
        ui.spinner(),
      ]),
      ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn rename_tag_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.div([attribute.class("flex flex-col mx-auto w-full gap-10")], [
          html.h1([attribute.class("font-semibold text-3xl")], [
            html.text("rename tag"),
          ]),

          children,
        ]),
      ],
    ),
  ])
}

pub fn rename_tag_form(form: Form(RenameTagSchema), id: TagId) -> Element(a) {
  let name_error = list.first(form.field_error_messages(form, "name"))
  let root_error = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute(
        "hx-patch",
        "/tags/" <> int.to_string(id.value) <> "/name",
      ),
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
            html.text("tag name"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(form, "name")),
            attribute.placeholder("chest"),
            attribute.autocomplete("off"),
            attribute.aria_invalid(
              string.lowercase(bool.to_string(result.is_ok(name_error))),
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
            ui.alert_description([], element.text(message)),
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

pub fn rename_tag_error(msg: String) {
  element.fragment([
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("rename tag failed")),
      ui.alert_description([], element.text(msg)),
    ]),

    ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
      html.text("back"),
    ]),
  ])
}

pub fn remove_tag_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.div([attribute.class("flex flex-col mx-auto w-full gap-10")], [
          html.h1([attribute.class("font-semibold text-3xl")], [
            html.text("remove tag"),
          ]),
          children,
        ]),
      ],
    ),
  ])
}

pub fn remove_tag_form(tag: Tag) -> Element(a) {
  html.form(
    [
      attribute.attribute("hx-delete", "/tags/" <> int.to_string(tag.id.value)),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.p([attribute.class("text-outline")], [
        html.text("Are you sure you want to remove the tag "),
        html.strong([attribute.class("text-on-surface")], [
          html.text(tag.name.value),
        ]),
        html.text("? This action cannot be undone."),
      ]),

      ui.button(
        ui.ButtonDestroy,
        [
          attribute.type_("submit"),
        ],
        [
          html.text("yes, remove tag"),
          ui.spinner(),
        ],
      ),
      ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn remove_tag_error(msg: String) {
  element.fragment([
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("removing tag failed")),
      ui.alert_description([], element.text(msg)),
    ]),

    ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
      html.text("back"),
    ]),
  ])
}
