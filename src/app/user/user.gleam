import app/auth_session/auth_session.{type User}
import app/ctx.{type Ctx}
import app/ui
import app/web
import gleam/int
import gleam/string
import gleam/time/calendar
import gleam/time/timestamp
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
        attribute.class(" flex flex-col p-10 gap-10 max-w-3xl mx-auto m-20"),
      ],
      [children],
    ),
  ])
}

fn account_details(user: User) -> Element(a) {
  let #(created_at_date, _) =
    timestamp.to_calendar(user.created_at, calendar.utc_offset)

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
        html.span(
          [
            attribute.class(
              "row-start-2 col-start-2 text-sm text-outline truncate",
            ),
          ],
          [html.text(user.email)],
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
              html.time(
                [
                  attribute.datetime(timestamp.to_rfc3339(
                    user.created_at,
                    calendar.utc_offset,
                  )),
                ],
                [
                  html.text(
                    "joined "
                    <> calendar.month_to_string(created_at_date.month)
                    <> " "
                    <> int.to_string(created_at_date.year),
                  ),
                ],
              ),
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
