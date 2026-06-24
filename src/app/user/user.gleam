import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/ui
import app/web
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import wisp.{type Request, type Response}

pub fn view_account_page(req: Request, ctx: Ctx) -> Response {
  use session <- auth_session.require(req, ctx)

  account_details(session.email_address)
  |> account_page(req)
  |> web.html(200)
}

fn account_page(children: Element(a), req: Request) -> Element(a) {
  ui.layout([
    ui.nav_bar(req),
    html.main(
      [
        attribute.class(" flex flex-col p-10 gap-10 max-w-3xl mx-auto m-20"),
      ],
      [children],
    ),
  ])
}

fn account_details(email: String) -> Element(a) {
  element.fragment([
    html.section(
      [
        attribute.class(
          "grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] gap-x-7 items-center",
        ),
        attribute.aria_label("Profile"),
      ],
      [
        html.span(
          [
            attribute.class(
              "uppercase size-14 text-xl bg-on-surface text-surface flex items-center justify-center font-semibold row-span-2",
            ),
            attribute.aria_hidden(True),
          ],
          [html.text("as")],
        ),
        html.h2(
          [
            attribute.class("capitalize font-semibold text-3xl truncate"),
          ],
          [html.text("augustin sorel")],
        ),
        html.span(
          [
            attribute.class(
              "row-start-2 col-start-2 text-sm text-outline truncate",
            ),
          ],
          [html.text(email)],
        ),
        html.dl(
          [
            attribute.class(
              "text-right row-span-2 h-full flex justify-evenly flex-col",
            ),
          ],
          [
            html.dt([attribute.class("sr-only")], [html.text("Joined")]),
            html.dd([attribute.class("text-sm text-outline truncate")], [
              html.text("joined jan 2024"),
            ]),
            html.dt([attribute.class("sr-only")], [html.text("Workouts")]),
            html.dd([attribute.class("text-sm text-outline truncate")], [
              html.text("24 workouts"),
            ]),
          ],
        ),
      ],
    ),

    html.menu(
      [attribute.aria_label("Account actions"), attribute.class("contents")],
      [
        html.li([], [
          ui.button(
            ui.ButtonPrimary,
            [
              attribute.attribute("hx-post", "/sign-out"),
              attribute.attribute("hx-disable", "this"),
            ],
            [
              html.text("sign out"),
              ui.spinner(),
            ],
          ),
        ]),
        html.li([], [
          ui.button(
            ui.ButtonDestroy,
            [
              attribute.attribute("hx-post", "/delete-account"),
              attribute.attribute("hx-disable", "this"),
            ],
            [
              html.text("delete account"),
              ui.spinner(),
            ],
          ),
        ]),
      ],
    ),
  ])
}
