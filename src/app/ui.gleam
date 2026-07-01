import gleam/bool
import gleam/list
import gleam/string
import lustre/attribute.{type Attribute}
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import wisp.{type Request}

pub fn layout(children: List(Element(a))) -> Element(a) {
  html.html([attribute.lang("en")], [
    html.head([], [
      html.meta([attribute.charset("utf-8")]),
      html.meta([
        attribute.name("viewport"),
        attribute.content("width=device-width, initial-scale=1"),
      ]),
      html.link([
        attribute.href("/static/styles.css"),
        attribute.rel("stylesheet"),
      ]),
      html.script(
        [
          attribute.src("https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta5"),
        ],
        "",
      ),
      html.script(
        [
          attribute.src("https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.93"),
        ],
        "",
      ),
      html.script(
        [],
        "
          const cachedTheme = localStorage.getItem('theme')

          if (cachedTheme) {
            document.documentElement.dataset['theme'] = cachedTheme;
          }
        ",
      ),
      html.title([], "auth"),
    ]),
    html.body([attribute.class("bg-surface text-on-surface")], children),
  ])
}

pub fn nav_bar(req: Request) {
  let links = [
    #("exercises", "/exercises"),
    #("stats", "/stats"),
    #("account", "/account"),
  ]

  html.header(
    [
      attribute.class(
        "border-b-4 py-7 px-[max(calc((100vw-var(--max-width-app))/2),1rem)] flex justify-between bg-surface-container-lowest",
      ),
    ],
    [
      html.h1([attribute.class("uppercase text-sm")], [
        html.text("gym graphs"),
      ]),
      html.nav(
        [attribute.class("space-x-5")],
        list.map(links, fn(l) {
          let #(title, href) = l
          link(
            [
              attribute.href(href),
              attribute.class(
                "text-sm uppercase font-semibold aria-current:bg-on-surface aria-current:text-surface px-2 py-1 hover:bg-on-surface hover:text-surface focus-visible:ring-on-surface",
              ),
              attribute.aria_current(
                string.lowercase(bool.to_string(href == req.path)),
              ),
            ],
            [
              html.text(title),
            ],
          )
        }),
      ),
    ],
  )
}

pub fn spinner() -> Element(a) {
  svg.svg(
    [
      attribute.attribute("xmlns", "http://www.w3.org/2000/svg"),
      attribute.attribute("viewBox", "0 0 2400 2400"),
      attribute.attribute("width", "16"),
      attribute.attribute("height", "16"),
      attribute.class("stroke-current htmx-indicator"),
      attribute.id("idk"),
    ],
    [
      svg.g(
        [
          attribute.attribute("stroke-width", "200"),
          attribute.attribute("stroke-linecap", "round"),
          attribute.attribute("fill", "none"),
        ],
        [
          svg.path([attribute.attribute("d", "M1200 600V100")]),
          svg.path([
            attribute.attribute("opacity", ".5"),
            attribute.attribute("d", "M1200 2300v-500"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".917"),
            attribute.attribute("d", "M900 680.4l-250-433"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".417"),
            attribute.attribute("d", "M1750 2152.6l-250-433"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".833"),
            attribute.attribute("d", "M680.4 900l-433-250"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".333"),
            attribute.attribute("d", "M2152.6 1750l-433-250"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".75"),
            attribute.attribute("d", "M600 1200H100"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".25"),
            attribute.attribute("d", "M2300 1200h-500"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".667"),
            attribute.attribute("d", "M680.4 1500l-433 250"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".167"),
            attribute.attribute("d", "M2152.6 650l-433 250"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".583"),
            attribute.attribute("d", "M900 1719.6l-250 433"),
          ]),
          svg.path([
            attribute.attribute("opacity", ".083"),
            attribute.attribute("d", "M1750 247.4l-250 433"),
          ]),
          svg.animate_transform([
            attribute.attribute("attributeName", "transform"),
            attribute.attribute("attributeType", "XML"),
            attribute.attribute("type", "rotate"),
            attribute.attribute(
              "keyTimes",
              "0;0.08333;0.16667;0.25;0.33333;0.41667;0.5;0.58333;0.66667;0.75;0.83333;0.91667",
            ),
            attribute.attribute(
              "values",
              "0 1199 1199;30 1199 1199;60 1199 1199;90 1199 1199;120 1199 1199;150 1199 1199;180 1199 1199;210 1199 1199;240 1199 1199;270 1199 1199;300 1199 1199;330 1199 1199",
            ),
            attribute.attribute("dur", "0.83333s"),
            attribute.attribute("begin", "0s"),
            attribute.attribute("repeatCount", "indefinite"),
            attribute.attribute("calcMode", "discrete"),
          ]),
        ],
      ),
    ],
  )
}

pub type ButtonVariant {
  ButtonPrimary
  ButtonLink
  ButtonDestroy
}

fn button_classes(variant: ButtonVariant) -> String {
  let shared =
    "items-center font-semibold justify-center gap-1.5 py-2 px-4 inline-flex text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
  let variant_classes = case variant {
    ButtonPrimary ->
      "bg-on-surface text-surface hover:bg-on-surface/80 focus-visible:ring-on-surface focus-visible:ring-offset-surface"
    ButtonLink ->
      "underline font-normal hover:text-current/80 focus-visible:ring-on-surface p-0"
    ButtonDestroy ->
      "bg-error text-on-error focus-visible:ring-error hover:bg-error/80 focus-visible:ring-offset-surface"
  }
  shared <> " " <> variant_classes
}

pub fn button(
  variant: ButtonVariant,
  attrs: List(Attribute(a)),
  children: List(Element(a)),
) -> Element(a) {
  html.button(
    list.append([attribute.class(button_classes(variant))], attrs),
    children,
  )
}

pub fn button_link(
  variant: ButtonVariant,
  attrs: List(Attribute(a)),
  children: List(Element(a)),
) -> Element(a) {
  html.a(
    list.append([attribute.class(button_classes(variant))], attrs),
    children,
  )
}

pub type AlertVariant {
  AlertError
  AlertSuccess
}

pub fn alert(
  variant: AlertVariant,
  attrs: List(Attribute(a)),
  children: List(Element(a)),
) -> Element(a) {
  let classes = case variant {
    AlertError -> "bg-error-container border-2 border-error p-3 grid gap-1"
    AlertSuccess ->
      "bg-success-container border-2 border-success p-3 grid gap-1"
  }
  html.div(
    list.append([attribute.role("alert"), attribute.class(classes)], attrs),
    children,
  )
}

pub fn alert_title(children: Element(a)) -> Element(a) {
  html.p([attribute.class("font-semibold")], [children])
}

pub fn alert_description(children: Element(a)) -> Element(a) {
  html.p([attribute.class("text-sm")], [
    children,
  ])
}

pub fn input(attrs: List(Attribute(a))) -> Element(a) {
  html.input(list.append(
    [
      attribute.class(
        "border-b-2 py-1 border-current outline-none focus-visible:shadow-[0_2px_0_0_currentColor] disabled:opacity-50 disabled:cursor-not-allowed",
      ),
    ],
    attrs,
  ))
}

pub fn link(
  attrs: List(Attribute(a)),
  children: List(Element(a)),
) -> Element(a) {
  html.a(
    list.append(
      [
        attribute.class(
          "font-semibold text-sm underline hover:text-current/80 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-offset-4 focus-visible:ring-offset-surface",
        ),
      ],
      attrs,
    ),
    children,
  )
}
