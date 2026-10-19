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

pub fn create_tag_form() -> Element(a) {
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
            attribute.value(""),
            attribute.placeholder("e.g. legs, push, cardio"),
            attribute.autocomplete("off"),
            attribute.aria_invalid("false"),
          ]),
        ],
      ),
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
