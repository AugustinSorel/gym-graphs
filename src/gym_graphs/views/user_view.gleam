import gleam/option
import gleam/string
import gym_graphs/domains/user.{type User}
import gym_graphs/ui
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
          html.text(string.slice(from: user.name.value, at_index: 0, length: 2)),
        ],
      ),
      html.h1(
        [
          attribute.class("capitalize font-semibold text-3xl break-all"),
        ],
        [html.text(user.name.value)],
      ),
      html.p(
        [
          attribute.class("text-sm text-outline break-all"),
        ],
        [html.text(user.email.value)],
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
              html.text(user.email.value),
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
              html.text(user.name.value),
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
          html.text("danger zone"),
        ],
      ),
      remove_account_row(error: option.None),
    ]),
  ])
}

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
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
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
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
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
          attribute.attribute("hx-target", "closest div"),
          attribute.attribute("hx-swap", "outerHTML"),
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
            ui.alert_title(element.text("deleting account failed")),
            ui.alert_description(element.text(msg)),
          ])
        option.None -> element.none()
      },
    ],
  )
}
