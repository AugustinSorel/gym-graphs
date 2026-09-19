import app/ui
import domains/user/user.{type User}
import features/user/forms.{type EditNameForm}
import formal/form.{type Form}
import gleam/list
import gleam/option
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn account_page(children: Element(a), path: String) -> Element(a) {
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [children],
    ),
  ])
}

pub fn account_details(
  user: User,
  // tags: List(tag_sql.SelectByUserIdRow),
) -> Element(a) {
  element.fragment([
    html.header([attribute.class("space-y-1")], [
      html.span(
        [
          attribute.class(
            "uppercase size-16 mb-5 text-xl bg-on-surface text-surface flex items-center justify-center font-semibold row-span-2",
          ),
          attribute.aria_hidden(True),
        ],
        [
          html.text(string.slice(from: user.name, at_index: 0, length: 2)),
        ],
      ),
      html.h1(
        [
          attribute.class("capitalize font-semibold text-3xl break-all"),
        ],
        [html.text(user.name)],
      ),
      html.p(
        [
          attribute.class("text-sm text-outline break-all"),
        ],
        [html.text(user.email_address)],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("profile"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-dotted border-outline/50",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("email"),
            ]),
            html.dd([attribute.class("break-all")], [
              html.text(user.email_address),
            ]),
          ]),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("name"),
            ]),
            html.dd([attribute.class("capitalize break-all")], [
              html.text(user.name),
            ]),
          ]),
          ui.link(
            [
              attribute.href("/account/name"),
              attribute.class("my-auto text-sm"),
            ],
            [html.text("edit")],
          ),
        ],
      ),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("security"),
        ],
      ),
      update_password_row(error: option.None),
      sign_out_row(error: option.None),
    ]),

    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("preferences"),
        ],
      ),
      // weight_unit_form(
      // get_weight_unit_form()
      // |> form.add_values([
      //   #("weight_unit", case user.weight_unit {
      //     user.Lbs -> "lbs"
      //     user.Kg -> "kg"
      //   }),
      // ]),
      // ),
      html.div(
        [
          attribute.class(
            "py-7 border-b-2 border-outline/50 border-dotted flex items-center justify-between",
          ),
        ],
        [
          html.p([attribute.class("text-outline text-sm")], [
            html.text("theme"),
          ]),
          html.fieldset(
            [attribute.class("flex border-2 border-on-surface w-fit")],
            [
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("system"),
                attribute.id("theme-system"),
                attribute.class("sr-only peer/system"),
              ]),
              html.label(
                [
                  attribute.for("theme-system"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer border-r-2 border-on-surface peer-checked/system:bg-on-surface peer-checked/system:text-surface peer-[:not(:checked)]/system:hover:bg-on-surface/10 transition-colors peer-focus-visible/system:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("system")],
              ),
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("light"),
                attribute.id("theme-light"),
                attribute.class("sr-only peer/light"),
              ]),
              html.label(
                [
                  attribute.for("theme-light"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer border-r-2 border-on-surface peer-checked/light:bg-on-surface peer-checked/light:text-surface peer-[:not(:checked)]/light:hover:bg-on-surface/10  transition-colors peer-focus-visible/light:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("light")],
              ),
              html.input([
                attribute.type_("radio"),
                attribute.name("theme"),
                attribute.value("dark"),
                attribute.id("theme-dark"),
                attribute.class("sr-only peer/dark"),
              ]),
              html.label(
                [
                  attribute.for("theme-dark"),
                  attribute.class(
                    "px-5 py-2 text-sm font-semibold uppercase cursor-pointer peer-checked/dark:bg-on-surface peer-checked/dark:text-surface peer-[:not(:checked)]/dark:hover:bg-on-surface/10 transition-colors peer-focus-visible/dark:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
                  ),
                ],
                [html.text("dark")],
              ),
            ],
          ),
        ],
      ),
      // one_rep_max_algorithm_form(
    //   get_one_rep_max_algorithm_form()
    //   |> form.add_values([
    //     #(
    //       "one_rep_max_algorithm",
    //       one_rep_max_algorithm_to_form_value(user.one_rep_max_algorithm),
    //     ),
    //   ]),
    // ),
    ]),

    // tags_section(tags),
    html.section([], [
      html.h2(
        [
          attribute.class(
            "uppercase text-outline border-b-4 border-on-surface text-sm pb-2 w-full",
          ),
        ],
        [
          html.text("danger zone"),
        ],
      ),
      remove_account_row(error: option.None),
    ]),
  ])
}

pub fn download_user_data(error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
      ),
    ],
    [
      html.dl([attribute.class("space-y-1")], [
        html.dt([attribute.class("text-outline text-sm")], [
          html.text("your data"),
        ]),
        html.dd([attribute.class("break-all")], [
          html.text("download your data"),
        ]),
      ]),
      ui.button_link(
        ui.ButtonPrimary,
        [
          attribute.href("/account/data"),
          attribute.class("my-auto"),
        ],
        [html.text("download")],
      ),

      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("downloading data failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

// pub fn get_weight_unit_form() {
//   form.new({
//     use weight_unit <- form.field("weight_unit", {
//       form.parse(fn(input) {
//         case input {
//           ["kg", ..] -> Ok(user.Kg)
//           ["lbs", ..] -> Ok(user.Lbs)
//           _ -> Error(#(user.Kg, "weight unit must be kg or lbs"))
//         }
//       })
//     })

//     form.success(weight_unit)
//   })
// }

// pub fn weight_unit_form(form: Form(user.WeightUnit)) {
//   let root_err = list.first(form.field_error_messages(form, "root"))

//   html.form(
//     [
//       attribute.attribute("hx-patch", "/account/weight-unit"),
//       attribute.attribute("hx-trigger", "change"),
//       attribute.attribute("hx-swap", "outerHTML"),
//       attribute.class(
//         "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
//       ),
//     ],
//     [
//       html.p([attribute.class("text-outline text-sm")], [
//         html.text("weight unit"),
//       ]),
//       html.fieldset(
//         [
//           attribute.class("flex border-2 border-on-surface w-fit"),
//         ],
//         [
//           html.label(
//             [
//               attribute.class(
//                 "px-5 py-2 text-sm font-semibold uppercase cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
//               ),
//             ],
//             [
//               html.input([
//                 attribute.type_("radio"),
//                 attribute.name("weight_unit"),
//                 attribute.value("kg"),
//                 attribute.checked(form.field_value(form, "weight_unit") == "kg"),
//                 attribute.class("sr-only"),
//               ]),
//               html.abbr(
//                 [attribute.title("kilograms"), attribute.class("no-underline")],
//                 [html.text("kg")],
//               ),
//             ],
//           ),
//           html.label(
//             [
//               attribute.class(
//                 "px-5 py-2 text-sm font-semibold uppercase cursor-pointer has-[:checked]:bg-on-surface has-[:checked]:text-surface hover:bg-on-surface/10 transition-colors has-[:focus-visible]:ring-4 ring-on-surface ring-offset-2 ring-offset-surface",
//               ),
//             ],
//             [
//               html.input([
//                 attribute.type_("radio"),
//                 attribute.name("weight_unit"),
//                 attribute.value("lbs"),
//                 attribute.checked(
//                   form.field_value(form, "weight_unit") == "lbs",
//                 ),
//                 attribute.class("sr-only"),
//               ]),
//               html.abbr(
//                 [attribute.title("pounds"), attribute.class("no-underline")],
//                 [html.text("lbs")],
//               ),
//             ],
//           ),
//         ],
//       ),
//       case root_err {
//         Ok(msg) ->
//           ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
//             ui.alert_title(element.text("changing weight unit failed")),
//             ui.alert_description(element.text(msg)),
//           ])
//         Error(_) -> element.none()
//       },
//     ],
//   )
// }

pub fn update_password_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline/50 border-dotted gap-3",
      ),
    ],
    [
      html.dl([attribute.class("space-y-1")], [
        html.dt([attribute.class("text-outline text-sm")], [
          html.text("password"),
        ]),
        html.dd([attribute.class("break-all")], [html.text("***********")]),
      ]),
      ui.button(
        ui.ButtonPrimary,
        [
          attribute.attribute("hx-post", "/update-password"),
          attribute.attribute("hx-disable", "this"),
          attribute.class("my-auto text-sm"),
        ],
        [html.text("update"), ui.spinner()],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("updating password failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

pub fn sign_out_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
      ),
    ],
    [
      html.div([attribute.class("space-y-1")], [
        html.p([attribute.class("text-outline text-sm")], [
          html.text("session"),
        ]),
        html.p([attribute.class("text-balance")], [
          html.text("sign out from this current device."),
        ]),
      ]),
      ui.button(
        ui.ButtonPrimary,
        [
          attribute.attribute("hx-post", "/sign-out"),
          attribute.attribute("hx-disable", "this"),
          attribute.class("my-auto ml-auto"),
        ],
        [
          html.text("sign out"),
          ui.spinner(),
        ],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("signing out failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

// pub fn get_one_rep_max_algorithm_form() {
//   form.new({
//     use one_rep_max_algorithm <- form.field("one_rep_max_algorithm", {
//       form.parse(fn(input) {
//         case input {
//           ["adams", ..] -> Ok(one_rep_max.Adams)
//           ["baechle", ..] -> Ok(one_rep_max.Baechle)
//           ["berger", ..] -> Ok(one_rep_max.Berger)
//           ["brown", ..] -> Ok(one_rep_max.Brown)
//           ["brzycki", ..] -> Ok(one_rep_max.Brzycki)
//           ["epley", ..] -> Ok(one_rep_max.Epley)
//           ["kemmler", ..] -> Ok(one_rep_max.Kemmler)
//           ["landers", ..] -> Ok(one_rep_max.Landers)
//           ["lombardi", ..] -> Ok(one_rep_max.Lombardi)
//           ["mayhew", ..] -> Ok(one_rep_max.Mayhew)
//           ["naclerio", ..] -> Ok(one_rep_max.Naclerio)
//           ["oconner", ..] -> Ok(one_rep_max.OConner)
//           ["wathen", ..] -> Ok(one_rep_max.Wathen)
//           _ ->
//             Error(#(
//               one_rep_max.Epley,
//               "one rep max algorithm must be a valid algorithm",
//             ))
//         }
//       })
//     })

//     form.success(one_rep_max_algorithm)
//   })
// }

// fn one_rep_max_algorithm_to_form_value(algo: one_rep_max.Algorithm) -> String {
//   case algo {
//     one_rep_max.Adams -> "adams"
//     one_rep_max.Baechle -> "baechle"
//     one_rep_max.Berger -> "berger"
//     one_rep_max.Brown -> "brown"
//     one_rep_max.Brzycki -> "brzycki"
//     one_rep_max.Epley -> "epley"
//     one_rep_max.Kemmler -> "kemmler"
//     one_rep_max.Landers -> "landers"
//     one_rep_max.Lombardi -> "lombardi"
//     one_rep_max.Mayhew -> "mayhew"
//     one_rep_max.Naclerio -> "naclerio"
//     one_rep_max.OConner -> "oconner"
//     one_rep_max.Wathen -> "wathen"
//   }
// }

// pub fn one_rep_max_algorithm_form(form: form.Form(one_rep_max.Algorithm)) {
//   let algorithms = [
//     #("adams", "adams"),
//     #("baechle", "baechle"),
//     #("berger", "berger"),
//     #("brown", "brown"),
//     #("brzycki", "brzycki"),
//     #("epley", "epley"),
//     #("kemmler", "kemmler"),
//     #("landers", "landers"),
//     #("lombardi", "lombardi"),
//     #("mayhew", "mayhew"),
//     #("naclerio", "naclerio"),
//     #("oconner", "oConner"),
//     #("wathen", "wathen"),
//   ]

//   let root_err = list.first(form.field_error_messages(form, "root"))

//   html.div(
//     [
//       attribute.class(
//         "py-7 border-b-2 border-outline/50 border-dotted space-y-5",
//       ),
//     ],
//     [
//       html.form(
//         [
//           attribute.attribute("hx-patch", "/account/one-rep-max-algorithm"),
//           attribute.attribute("hx-trigger", "change"),
//           attribute.attribute("hx-swap", "outerHTML"),
//           attribute.class("grid grid-cols-[1fr_auto] gap-y-3 items-center"),
//         ],
//         [
//           html.label(
//             [
//               attribute.for("one-rep-max-algorithm"),
//               attribute.class("text-outline text-sm"),
//             ],
//             [html.text("one rep max algorithm")],
//           ),
//           ui.select(
//             [
//               attribute.name("one_rep_max_algorithm"),
//               attribute.id("one-rep-max-algorithm"),
//             ],
//             list.map(algorithms, fn(algo) {
//               let #(value, label) = algo
//               html.option(
//                 [
//                   attribute.value(value),
//                   attribute.selected(
//                     form.field_value(form, "one_rep_max_algorithm") == value,
//                   ),
//                 ],
//                 label,
//               )
//             }),
//           ),
//           case root_err {
//             Ok(msg) ->
//               ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
//                 ui.alert_title(element.text("changing algorithm failed")),
//                 ui.alert_description(element.text(msg)),
//               ])
//             Error(_) -> element.none()
//           },
//         ],
//       ),
//       html.div(
//         [
//           attribute.attribute("data-graph-container", ""),
//           attribute.attribute("hx-get", "/account/one-rep-max-algorithm.svg"),
//           attribute.attribute(
//             "hx-trigger",
//             "graph-resize, one-rep-max-algorithm-changed from:body",
//           ),
//           attribute.attribute("hx-swap", "innerHTML"),
//           attribute.class("h-[200px]"),
//         ],
//         [],
//       ),
//     ],
//   )
// }

// pub fn one_rep_max_algorithm_graph(
//   width width: Int,
//   height height: Int,
//   algorithm algorithm: one_rep_max.Algorithm,
// ) -> Element(a) {
//   let algorithms = [
//     one_rep_max.Adams,
//     one_rep_max.Baechle,
//     one_rep_max.Berger,
//     one_rep_max.Brown,
//     one_rep_max.Brzycki,
//     one_rep_max.Epley,
//     one_rep_max.Kemmler,
//     one_rep_max.Landers,
//     one_rep_max.Lombardi,
//     one_rep_max.Mayhew,
//     one_rep_max.Naclerio,
//     one_rep_max.OConner,
//     one_rep_max.Wathen,
//   ]

//   let mock_points = [
//     #(1, 1.0),
//     #(5, 5.0),
//     #(10, 10.0),
//     #(15, 15.0),
//     #(20, 20.0),
//     #(25, 25.0),
//   ]

//   let all_data =
//     list.map(algorithms, fn(algo) {
//       let points =
//         list.map(mock_points, fn(p) {
//           let #(reps, weight) = p
//           let orm =
//             one_rep_max.calculate(algo: algo, weight: weight, repetitions: reps)
//           #(int.to_float(reps), orm)
//         })
//       #(algo, points)
//     })

//   let all_ys =
//     list.flat_map(all_data, fn(entry) {
//       let #(_, points) = entry
//       list.map(points, fn(p) { p.1 })
//     })

//   let min_x = 1.0
//   let max_x = 25.0
//   let min_y = list.reduce(all_ys, float.min) |> result.unwrap(0.0)
//   let max_y = list.reduce(all_ys, float.max) |> result.unwrap(0.0)

//   let scale_x =
//     scale.linear(domain: #(min_x, max_x), range: #(0.0, int.to_float(width)))
//   let scale_y =
//     scale.linear(domain: #(min_y, max_y), range: #(int.to_float(height), 0.0))

//   let paths =
//     list.map(all_data, fn(entry) {
//       let #(algo, points) = entry
//       let is_active = algo == algorithm
//       let path_d =
//         points
//         |> line.new()
//         |> line.x(fn(d) { scale_x(d.0) })
//         |> line.y(fn(d) { scale_y(d.1) })
//         |> line.to_path
//       svg.path([
//         attribute.attribute("d", path_d),
//         attribute.class(case is_active {
//           True -> "stroke-on-surface fill-none stroke-2"
//           False -> "stroke-outline/40 fill-none stroke-1"
//         }),
//       ])
//     })

//   svg.svg(
//     [
//       attribute.attribute("width", int.to_string(width)),
//       attribute.attribute("height", int.to_string(height)),
//     ],
//     paths,
//   )
// }

pub fn remove_account_row(error error: option.Option(String)) {
  html.div(
    [
      attribute.class(
        "py-7 border-b-2 border-outline/50 border-dotted grid grid-cols-[1fr_auto] gap-y-3 items-center",
      ),
    ],
    [
      html.div([attribute.class("space-y-1")], [
        html.p([attribute.class("text-outline text-sm")], [
          html.text("remove account"),
        ]),
        html.p([attribute.class("text-balance")], [
          html.text("remove your account from all of our servers."),
        ]),
      ]),
      ui.button(
        ui.ButtonDestroy,
        [
          attribute.attribute("hx-post", "/delete-account"),
          attribute.attribute("hx-disable", "this"),
          attribute.class("my-auto ml-auto"),
        ],
        [
          html.text("delete account"),
          ui.spinner(),
        ],
      ),
      case error {
        option.Some(msg) ->
          ui.alert(ui.AlertError, [attribute.class("col-span-2")], [
            ui.alert_title(element.text("signing out failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}

pub fn edit_name_page(
  children: Element(a),
  path: String,
  name: String,
) -> Element(a) {
  let initials = case string.length(string.trim(name)) {
    0 -> "??"
    1 -> string.uppercase(string.trim(name))
    _ -> string.uppercase(string.slice(string.trim(name), 0, 2))
  }
  ui.layout([
    ui.nav_bar(path),
    html.main(
      [
        attribute.class(
          "flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto my-10 lg:my-20",
        ),
      ],
      [
        html.div([attribute.class("flex flex-col items-center gap-2 mb-4")], [
          html.span(
            [
              attribute.id("edit-name-avatar"),
              attribute.class(
                "uppercase size-16 text-xl bg-on-surface text-surface flex items-center justify-center font-semibold",
              ),
              attribute.attribute("aria-hidden", "true"),
            ],
            [html.text(initials)],
          ),
          html.span(
            [
              attribute.class("text-outline text-xs uppercase tracking-widest"),
            ],
            [html.text("preview")],
          ),
        ]),
        children,
      ],
    ),
  ])
}

pub fn edit_name_form(f: Form(EditNameForm)) -> Element(a) {
  let name_err = list.first(form.field_error_messages(f, "name"))
  let root_err = list.first(form.field_error_messages(f, "root"))

  html.form(
    [
      attribute.attribute("hx-patch", "/account/name"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("flex flex-col gap-10"),
      attribute.attribute("data-htmx-powered", "true"),
    ],
    [
      html.label(
        [
          attribute.class("grid gap-2 has-[>[aria-invalid=true]]:text-error"),
        ],
        [
          html.span([attribute.class("text-outline text-sm")], [
            html.text("display name"),
          ]),
          ui.input([
            attribute.type_("text"),
            attribute.name("name"),
            attribute.value(form.field_value(f, "name")),
            attribute.attribute("autocomplete", "name"),
            attribute.aria_invalid(case name_err {
              Ok(_) -> "true"
              Error(_) -> "false"
            }),
            attribute.attribute(
              "oninput",
              "
						var v = this.value.trim();
						var a = document.getElementById('edit-name-avatar');
						if (!a) return;
						if (v.length >= 2) { a.textContent = v.slice(0,2).toUpperCase(); }
						else if (v.length === 1) { a.textContent = v.toUpperCase(); }
						else { a.textContent = '??'; }
					",
            ),
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
      ui.link([attribute.href("/account"), attribute.class("ml-auto")], [
        html.text("cancel"),
      ]),
    ],
  )
}
