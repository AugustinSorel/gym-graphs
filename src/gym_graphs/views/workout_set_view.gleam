import gleam/int
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/workout_set.{type SetId}
import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn remove_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-10 lg:gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.h1([attribute.class("font-semibold text-3xl")], [
          html.text("remove set"),
        ]),
        children,
      ],
    ),
  ])
}

pub fn remove_form(exercise_id: ExerciseId, set_id: SetId) -> Element(a) {
  let exercise_path = "/exercises/" <> int.to_string(exercise_id.value)
  let set_path = exercise_path <> "/sets/" <> int.to_string(set_id.value)

  html.form(
    [
      attribute.attribute("hx-delete", set_path),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
    ],
    [
      html.p([attribute.class("text-outline")], [
        html.text(
          "Are you sure you want to remove this set? This action cannot be undone.",
        ),
      ]),
      ui.button(ui.ButtonDestroy, [attribute.type_("submit")], [
        html.text("yes, remove set"),
        ui.spinner(),
      ]),
      ui.link([attribute.href(exercise_path), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}

pub fn remove_error(message: String) -> Element(a) {
  element.fragment([
    ui.alert(ui.AlertError, [], [
      ui.alert_title(element.text("removing set failed")),
      ui.alert_description([], element.text(message)),
    ]),
    ui.link([attribute.href("/exercises"), attribute.class("ml-auto")], [
      html.text("back"),
    ]),
  ])
}
