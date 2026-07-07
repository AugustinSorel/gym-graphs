import app/tag/sql as tag_sql
import app/ui
import formal/form.{type Form}
import gleam/int
import gleam/list
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request}

pub type NewTagForm {
  NewTagForm(name: String)
}

pub fn get_new_tag_form() -> Form(NewTagForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(NewTagForm(name:))
  }

  form.new(schema)
}

pub fn new_tag_form(f: Form(NewTagForm)) -> Element(a) {
  let name_err = list.first(form.field_error_messages(f, "name"))
  let root_err = list.first(form.field_error_messages(f, "root"))

  html.form(
    [
      attribute.attribute("hx-post", "/tags/new"),
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
            attribute.value(form.field_value(f, "name")),
            attribute.attribute("autocomplete", "off"),
            attribute.attribute("autofocus", ""),
            attribute.placeholder("cardio"),
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
      ui.link([attribute.href("/tags"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn new_tag_page(children: Element(a), req: Request) -> Element(a) {
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

pub fn remove_tag_page(children: Element(a), req: Request) -> Element(a) {
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
          html.text("remove tag"),
        ]),

        children,

        ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
          html.text("cancel"),
        ]),
      ],
    ),
  ])
}

pub fn remove_tag_alert(msg: String) {
  ui.alert(ui.AlertError, [], [
    ui.alert_title(element.text("Removing tag failed")),
    ui.alert_description(element.text(msg)),
  ])
}

pub fn remove_tag_dialog(tag: tag_sql.SelectByIdAndUserIdRow) {
  element.fragment([
    html.p([attribute.class("text-outline text-balance")], [
      html.text(
        "are you sure you want to remove the tag \""
        <> tag.name
        <> "\" from all of our servers ? This action cannot be undone.",
      ),
    ]),
    ui.button(
      ui.ButtonDestroy,
      [
        attribute.attribute("hx-delete", "/tags/" <> int.to_string(tag.id)),
        attribute.attribute("hx-disable", "this"),
      ],
      [html.text("yes remove tag"), ui.spinner()],
    ),
  ])
}

pub fn rename_tag_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        children,
      ],
    ),
  ])
}

pub type RenameForm {
  RenameForm(name: String)
}

pub fn get_rename_form() -> Form(RenameForm) {
  let schema = {
    use name <- form.field("name", {
      form.parse_string
      |> form.map(string.trim)
      |> form.check_not_empty
      |> form.check_string_length_less_than(100)
    })

    form.success(RenameForm(name:))
  }

  form.new(schema)
}

pub fn rename_tag_form(form: Form(RenameForm), id: String) {
  let name_err = list.first(form.field_error_messages(form, "name"))
  let root_err = list.first(form.field_error_messages(form, "root"))

  html.form(
    [
      attribute.attribute("hx-patch", "/tags/" <> id <> "/name"),
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
          attribute.value(form.field_value(form, "name")),
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
        Ok(msg) -> {
          ui.alert(ui.AlertError, [], [
            ui.alert_title(element.text("Renaming tag failed")),
            ui.alert_description(element.text(msg)),
          ])
        }
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
