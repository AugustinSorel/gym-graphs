import gym_graphs/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

const graph_data = "[{\"date\":1735689600000,\"oneRepMax\":72.3},{\"date\":1736294400000,\"oneRepMax\":74.1},{\"date\":1736899200000,\"oneRepMax\":73.8},{\"date\":1737504000000,\"oneRepMax\":76.5},{\"date\":1738108800000,\"oneRepMax\":75.2},{\"date\":1738713600000,\"oneRepMax\":78.9},{\"date\":1739318400000,\"oneRepMax\":79.4},{\"date\":1739923200000,\"oneRepMax\":80.1},{\"date\":1740528000000,\"oneRepMax\":78.6},{\"date\":1741132800000,\"oneRepMax\":82.3},{\"date\":1741737600000,\"oneRepMax\":83.7},{\"date\":1742342400000,\"oneRepMax\":81.9},{\"date\":1742947200000,\"oneRepMax\":86.2},{\"date\":1743552000000,\"oneRepMax\":85.0},{\"date\":1744156800000,\"oneRepMax\":88.4},{\"date\":1744761600000,\"oneRepMax\":87.1},{\"date\":1745366400000,\"oneRepMax\":90.5}]"

pub fn page() -> Element(a) {
  ui.layout([
    html.main(
      [
        attribute.class(
          "max-w-app mx-auto p-4 lg:p-20 space-y-32 lg:space-y-48",
        ),
      ],
      [header(), hero(), progress(), features(), call_to_action()],
    ),
  ])
}

fn header() -> Element(a) {
  html.header([attribute.class("flex items-center justify-between")], [
    html.span([attribute.class("text-sm uppercase")], [html.text("gym graphs")]),
    html.a(
      [
        attribute.href("https://github.com/augustinsorel/gym-graphs"),
        attribute.target("_blank"),
        attribute.rel("noopener noreferrer"),
        attribute.class(
          "text-sm text-outline hover:text-on-surface transition-colors outline-none focus-visible:ring-3 focus-visible:ring-offset-4 focus-visible:ring-offset-surface",
        ),
      ],
      [html.text("github")],
    ),
  ])
}

fn hero() -> Element(a) {
  html.section([attribute.class("flex flex-col justify-center gap-8")], [
    html.h1([attribute.class("text-3xl lg:text-6xl uppercase leading-tight")], [
      html.text("Your strength,"),
      html.br([]),
      html.text("as a graph."),
    ]),
    html.p(
      [
        attribute.class(
          "text-sm text-outline leading-relaxed text-balance max-w-3xl",
        ),
      ],
      [
        html.text(
          "log your sessions. watch each exercise trend upward. gym graphs turns your training log into the clearest progress report you've ever seen.",
        ),
      ],
    ),
    actions(False),
  ])
}

fn actions(inverted: Bool) -> Element(a) {
  let primary_classes = case inverted {
    True ->
      "bg-surface text-on-surface hover:bg-surface/80 focus-visible:ring-surface focus-visible:ring-offset-on-surface"
    False ->
      "bg-on-surface text-surface hover:bg-on-surface/80 focus-visible:ring-on-surface focus-visible:ring-offset-surface"
  }
  let link_classes = case inverted {
    True -> "focus-visible:ring-surface focus-visible:ring-offset-on-surface"
    False -> "focus-visible:ring-on-surface focus-visible:ring-offset-surface"
  }

  html.nav([attribute.class("flex gap-6 items-center")], [
    html.a(
      [
        attribute.href("/sign-up"),
        attribute.class(
          "inline-flex h-9 items-center justify-center px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-4 focus-visible:ring-offset-2 "
          <> primary_classes,
        ),
      ],
      [html.text("start tracking")],
    ),
    html.a(
      [
        attribute.href("/sign-in"),
        attribute.class(
          "text-sm font-semibold underline hover:text-current/70 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-offset-4 "
          <> link_classes,
        ),
      ],
      [html.text("sign in")],
    ),
  ])
}

fn progress() -> Element(a) {
  html.section([attribute.class("flex flex-col")], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 flex justify-between",
        ),
      ],
      [
        html.abbr(
          [
            attribute.title("one repetition maximum"),
            attribute.class("no-underline"),
          ],
          [html.text("1 rep max")],
        ),
        html.span([], [html.text("deadlift")]),
      ],
    ),
    html.script(
      [attribute.id("exercise-graph-data"), attribute.type_("application/json")],
      graph_data,
    ),
    html.div(
      [
        attribute.id("exercise-graph"),
        attribute.attribute("data-unit", "kg"),
        attribute.class(
          "w-full h-72 border-b-2 border-dotted border-outline/50",
        ),
      ],
      [],
    ),
    html.dl(
      [
        attribute.class(
          "py-7 border-b-2 border-dotted border-outline/50 grid grid-cols-2 lg:grid-cols-4 gap-y-6 text-center",
        ),
      ],
      [
        fact("best 1rm", "90.5", "kg", True),
        fact("best set", "85.0", "kg * 2", True),
        fact("avg reps / set", "4.8", "", True),
        fact("sessions", "17", "", False),
      ],
    ),
  ])
}

fn fact(
  label: String,
  value: String,
  suffix: String,
  has_border: Bool,
) -> Element(a) {
  let classes = case has_border {
    True -> "grid gap-1 lg:border-r-2 border-dotted border-outline/50"
    False -> "grid gap-1"
  }

  html.div([attribute.class(classes)], [
    html.dt([attribute.class("text-outline text-xs")], [html.text(label)]),
    html.dd([attribute.class("text-xl font-semibold")], [
      html.text(value),
      case suffix {
        "" -> html.text("")
        suffix ->
          html.span([attribute.class("text-sm font-normal text-outline")], [
            html.text(" " <> suffix),
          ])
      },
    ]),
  ])
}

fn features() -> Element(a) {
  html.section([attribute.class("flex flex-col")], [
    html.h2(
      [
        attribute.class(
          "uppercase text-outline border-b-4 border-on-surface text-sm pb-2",
        ),
      ],
      [html.text("what you get")],
    ),
    html.ul([attribute.class("flex flex-col")], [
      feature(
        "one rep max",
        "01",
        "Six 1RM formulas. Pick Epley, Brzycki or whatever you argue about.",
      ),
      feature(
        "tags",
        "02",
        "Group exercises by muscle. Chart a whole tag as one line.",
      ),
      feature(
        "your data",
        "03",
        "Export everything as CSV, any time. No lock-in, no upsell.",
      ),
      feature(
        "speed",
        "04",
        "Three taps between rack and logged. Works offline in the gym.",
      ),
    ]),
  ])
}

fn feature(label: String, number: String, description: String) -> Element(a) {
  html.li(
    [
      attribute.class(
        "grid grid-cols-[1fr_auto] py-6 border-b-2 border-dotted border-outline/50",
      ),
    ],
    [
      html.p([attribute.class("text-outline text-xs")], [html.text(label)]),
      html.span(
        [attribute.class("text-outline text-xs tabular-nums shrink-0")],
        [html.text(number)],
      ),
      html.p([attribute.class("text-sm mt-1")], [html.text(description)]),
    ],
  )
}

fn call_to_action() -> Element(a) {
  html.section(
    [
      attribute.class(
        "outline outline-5 outline-surface outline-offset-[-12px] border-2 bg-on-surface text-surface p-9 flex flex-col gap-6 border-on-surface",
      ),
    ],
    [
      html.div([], [
        html.h2([attribute.class("text-2xl font-bold")], [
          html.text("Free while you lift."),
        ]),
        html.p([attribute.class("text-sm text-outline leading-relaxed mt-3")], [
          html.text(
            "Unlimited exercises, unlimited sets, unlimited graphs. No card.",
          ),
        ]),
      ]),
      actions(True),
    ],
  )
}
