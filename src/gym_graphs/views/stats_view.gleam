import gym_graphs/domains/user.{type WeightUnit, Kg, Lbs}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn page(weight_unit: WeightUnit, path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("uppercase font-semibold text-3xl")], [
          html.text("your stats"),
        ]),
        weekly_summary(weight_unit),
      ],
    ),
  ])
}

fn weekly_summary(weight_unit: WeightUnit) -> Element(a) {
  let #(volume, weight, unit_name, unit_abbr) = case weight_unit {
    Kg -> #("21,840", "2,740", "kilograms", "kg")
    Lbs -> #("48,149", "6,041", "pounds", "lbs")
  }

  html.section([], [
    html.h2(
      [
        attribute.class(
          "border-b-4 border-on-surface pb-2 uppercase text-outline text-sm",
        ),
      ],
      [
        html.text("this week"),
      ],
    ),

    html.dl(
      [
        attribute.class(
          "grid grid-cols-2 py-7 text-center relative after:translate-x-px after:absolute after:border-l-2 after:border-dotted after:border-outline/50 after:w-1 after:top-7 after:bottom-7 after:left-1/2 after:-translate-x-1/2 before:absolute before:border-t-2 before:border-dotted before:border-outline/50 before:h-1 before:left-7 before:right-7 before:top-1/2 before:-translate-y-1/2 before:translate-y-px",
        ),
      ],
      [
        html.div(
          [
            attribute.class("py-6 space-y-1"),
          ],
          [
            html.dt([attribute.class("text-outline text-xs")], [
              html.text("total volume"),
            ]),
            html.dd([attribute.class("text-xl font-semibold tabular-nums")], [
              html.text(volume),
              html.abbr(
                [
                  attribute.title(unit_name),
                  attribute.class(
                    "ml-1 text-sm font-normal text-outline no-underline",
                  ),
                ],
                [html.text(unit_abbr)],
              ),
            ]),
          ],
        ),

        html.div(
          [
            attribute.class("py-6 space-y-1"),
          ],
          [
            html.dt([attribute.class("text-outline text-xs")], [
              html.text("total sets"),
            ]),
            html.dd([attribute.class("text-xl font-semibold tabular-nums")], [
              html.text("32"),
            ]),
          ],
        ),

        html.div(
          [
            attribute.class("py-6 space-y-1"),
          ],
          [
            html.dt([attribute.class("text-outline text-xs")], [
              html.text("total weight"),
            ]),
            html.dd([attribute.class("text-xl font-semibold tabular-nums")], [
              html.text(weight),
              html.abbr(
                [
                  attribute.title(unit_name),
                  attribute.class(
                    "ml-1 text-sm font-normal text-outline no-underline",
                  ),
                ],
                [html.text(unit_abbr)],
              ),
            ]),
          ],
        ),

        html.div(
          [
            attribute.class("py-6 space-y-1"),
          ],
          [
            html.dt([attribute.class("text-outline text-xs")], [
              html.text("exercises"),
            ]),
            html.dd([attribute.class("text-xl font-semibold tabular-nums")], [
              html.text("6"),
            ]),
          ],
        ),
      ],
    ),
  ])
}
