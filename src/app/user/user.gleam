import app/auth_session/auth_session.{type User}
import app/ctx.{type Ctx}
import app/ui
import app/web
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request, type Response}

pub fn view_account_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  account_details(user)
  |> account_page(req)
  |> web.html(200)
}

fn account_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(
          " flex flex-col py-10 px-5 lg:px-10 gap-20 max-w-3xl mx-auto m-20",
        ),
      ],
      [children],
    ),
  ])
}

fn account_details(user: User) -> Element(a) {
  element.fragment([
    html.section([attribute.class("space-y-1")], [
      html.div(
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
      html.h2(
        [
          attribute.class("capitalize font-semibold text-3xl truncate"),
        ],
        [html.text(user.name)],
      ),
      html.p(
        [
          attribute.class("text-sm text-outline truncate"),
        ],
        [html.text(user.email)],
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
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("email"),
            ]),
            html.dd([], [html.text(user.email)]),
          ]),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("name"),
            ]),
            html.dd([], [html.text(user.name)]),
          ]),
          ui.link(
            [
              attribute.href("/account/edit/name"),
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
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
          ),
        ],
        [
          html.dl([attribute.class("space-y-1")], [
            html.dt([attribute.class("text-outline text-sm")], [
              html.text("password"),
            ]),
            html.dd([], [html.text("***********")]),
          ]),
          ui.link(
            [
              attribute.href("/account/edit/name"),
              attribute.class("my-auto text-sm"),
            ],
            [html.text("edit")],
          ),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
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
              attribute.class("my-auto"),
            ],
            [
              html.text("sign out"),
              ui.spinner(),
            ],
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
          html.text("danger zone"),
        ],
      ),
      html.div(
        [
          attribute.class(
            "grid grid-cols-[1fr_auto] py-7 border-b-2 border-outline",
          ),
        ],
        [
          html.div([attribute.class("space-y-1")], [
            html.p([attribute.class("text-outline text-sm")], [
              html.text("remove account"),
            ]),
            html.p([], [
              html.text("remove your account from all of our servers."),
            ]),
          ]),
          ui.button(
            ui.ButtonDestroy,
            [
              attribute.attribute("hx-post", "/delete-account"),
              attribute.attribute("hx-disable", "this"),
              attribute.class("my-auto"),
            ],
            [
              html.text("delete account"),
              ui.spinner(),
            ],
          ),
        ],
      ),
    ]),
  ])
}
