import gleam/int
import gym_graphs/domains/stats.{type WeeklySummary}
import gym_graphs/domains/user.{type WeightUnit}
import gym_graphs/domains/weight.{type Weight}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn page(
  summary: WeeklySummary,
  weight_unit: WeightUnit,
  path: String,
) -> Element(a) {
  page_layout(weekly_summary(summary, weight_unit), path)
}

pub fn error_page(path: String) -> Element(a) {
  page_layout(
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("loading stats failed")),
      ui.alert_description([], element.text("Something went wrong.")),
    ]),
    path,
  )
}

fn page_layout(content: Element(a), path: String) -> Element(a) {
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
        content,
      ],
    ),
  ])
}

fn weekly_summary(
  summary: WeeklySummary,
  weight_unit: WeightUnit,
) -> Element(a) {
  html.section([], [
    html.h2(
      [
        attribute.class(
          "border-b-4 border-on-surface pb-2 uppercase text-outline text-sm",
        ),
      ],
      [html.text("this week")],
    ),
    html.dl(
      [
        attribute.class(
          "grid grid-cols-2 py-7 text-center relative after:translate-x-[3px] after:absolute after:border-l-2 after:border-dotted after:border-outline/50 after:w-1 after:top-7 after:bottom-7 after:left-1/2 after:-translate-x-1/2 before:absolute before:border-t-2 before:border-dotted before:border-outline/50 before:h-1 before:left-7 before:right-7 before:top-1/2 before:-translate-y-1/2 before:translate-y-[3px]",
        ),
      ],
      [
        weight_metric("total volume", summary.total_volume, weight_unit),
        count_metric("total sets", summary.total_sets),
        weight_metric("total weight", summary.total_weight, weight_unit),
        count_metric("exercises", summary.exercises_count),
      ],
    ),
  ])
}

fn weight_metric(label: String, value: Weight, unit: WeightUnit) -> Element(a) {
  metric(label, case weight.is_zero(value) {
    True -> html.text("-")
    False -> ui.display_weight(value, unit)
  })
}

fn count_metric(label: String, count: Int) -> Element(a) {
  metric(
    label,
    html.text(case count > 0 {
      True -> int.to_string(count)
      False -> "-"
    }),
  )
}

fn metric(label: String, value: Element(a)) -> Element(a) {
  html.div([attribute.class("py-6 space-y-1")], [
    html.dt([attribute.class("text-outline text-xs")], [html.text(label)]),
    html.dd([attribute.class("text-xl font-semibold tabular-nums")], [value]),
  ])
}
