import gleam/list
import lustre/attribute.{type Attribute}
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg

pub fn layout(children: Element(a)) -> Element(a) {
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
          attribute.src("https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4"),
        ],
        "",
      ),
      html.title([], "auth"),
    ]),
    html.body([attribute.class("bg-surface text-on-surface p-4")], [
      children,
    ]),
  ])
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

pub fn button(
  attrs: List(Attribute(a)),
  children: List(Element(a)),
) -> Element(a) {
  html.button(
    list.append(
      [
        attribute.class(
          "items-center justify-center gap-1.5 bg-on-surface inline-flex text-surface font-semibold p-2 text-sm hover:bg-on-surface/90 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
        ),
      ],
      attrs,
    ),
    children,
  )
}

pub fn alert(children: List(Element(a))) -> Element(a) {
  html.div(
    [
      attribute.role("alert"),
      attribute.class("bg-error-container border-2 border-error p-3 grid gap-1"),
    ],
    children,
  )
}

pub fn alert_title(children: Element(a)) -> Element(a) {
  html.p([attribute.class("text-on-error-container font-semibold")], [
    children,
  ])
}

pub fn alert_description(children: Element(a)) -> Element(a) {
  html.p([attribute.class("text-sm")], [
    children,
  ])
}
