import gleam/int
import gleam/list
import gym_graphs/domains/tag.{type Tag}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn page(exercise_count: Int, tags: List(Tag), path: String) -> Element(a) {
  page_layout(page_header(exercise_count, tags), path)
}

pub fn error_page(path: String) -> Element(a) {
  page_layout(
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("loading exercises failed")),
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
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [content],
    ),
  ])
}

fn page_header(exercise_count: Int, tags: List(Tag)) -> Element(a) {
  html.header([attribute.class("grid grid-cols-[1fr_auto] gap-4")], [
    html.h1([attribute.class("text-outline uppercase text-sm")], [
      html.text("exercises (" <> int.to_string(exercise_count) <> ")"),
    ]),
    ui.link([attribute.href("/exercises/new")], [html.text("+ add")]),
    tag_filters(tags),
  ])
}

fn tag_filters(tags: List(Tag)) -> Element(a) {
  case tags {
    [] -> element.none()
    _ ->
      element.fragment([
        html.details([attribute.class("group col-span-2 space-y-4")], [
          html.summary(
            [
              attribute.class(
                "cursor-pointer items-center gap-2 text-outline text-xs select-none outline-none focus-visible:ring-3 focus-visible:ring-offset-4 focus-visible:ring-offset-surface",
              ),
            ],
            [
              html.text("filters "),
              html.output(
                [
                  attribute.id("filter-count"),
                  attribute.class(
                    "[&:not(:empty)]:before:content-['_('] [&:not(:empty)]:after:content-[')']",
                  ),
                ],
                [],
              ),
            ],
          ),
          html.form([attribute.id("exercises-filter-form")], [
            html.fieldset(
              [
                attribute.class(
                  "space-y-2 border-b-2 border-outline/50 border-dotted pb-6",
                ),
              ],
              [
                html.legend(
                  [attribute.class("uppercase text-outline text-xs sr-only")],
                  [html.text("tags")],
                ),
                html.div(
                  [attribute.class("flex flex-wrap gap-2")],
                  list.map(tags, tag_filter),
                ),
              ],
            ),
          ]),
        ]),
        html.script(
          [],
          "(function () {\n  const form = document.getElementById('exercises-filter-form');\n  const output = document.getElementById('filter-count');\n  form.addEventListener('change', function () {\n    const count = form.querySelectorAll(\"input[name='filter_tag_ids']:checked\").length;\n    output.textContent = count > 0 ? String(count) : '';\n  });\n})();",
        ),
      ])
  }
}

fn tag_filter(tag: Tag) -> Element(a) {
  html.label(
    [
      attribute.class(
        "border-2 border-on-surface px-3 py-1 text-sm cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
      ),
    ],
    [
      html.input([
        attribute.type_("checkbox"),
        attribute.name("filter_tag_ids"),
        attribute.value(int.to_string(tag.id.value)),
        attribute.class("sr-only"),
      ]),
      html.text(" " <> tag.name.value),
    ],
  )
}
