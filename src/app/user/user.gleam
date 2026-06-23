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
  |> account_page()
  |> web.html(200)
}

fn account_page(children: Element(a)) -> Element(a) {
  ui.layout([
    html.header(
      [
        attribute.class(
          "border-b-4 py-7 px-[calc((100vw-var(--max-width-app))/2)]",
        ),
      ],
      [
        html.nav([], [
          ui.link(
            [
              attribute.href("/exercises"),
              attribute.class(
                "text-sm uppercase font-semibold aria-current:bg-on-surface aria-current:text-surface px-2 py-1",
              ),
            ],
            [
              html.text("exercises"),
            ],
          ),
        ]),
      ],
    ),
    html.main(
      [
        attribute.class(
          "border-2 border-current flex flex-col p-10 gap-10 max-w-app mx-auto m-20",
        ),
      ],
      [children],
    ),
  ])
}

fn account_details(email: String) -> Element(a) {
  element.fragment([
    html.h1([attribute.class("text-lg font-semibold")], [
      html.text("account"),
    ]),
    html.dl([attribute.class("text-sm")], [
      html.dt([], [html.text("email: ")]),
      html.dd([attribute.class("font-semibold")], [html.text(email)]),
    ]),

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
  ])
}
