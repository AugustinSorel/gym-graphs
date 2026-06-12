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
  ui.layout(html.main([], [children]))
}

fn account_details(email: String) -> Element(a) {
  html.main(
    [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
    [
      html.h1([attribute.class("text-lg font-semibold")], [
        html.text("account"),
      ]),
      html.dl([attribute.class("text-sm")], [
        html.dt([], [html.text("email: ")]),
        html.dd([attribute.class("font-semibold")], [html.text(email)]),
      ]),

      ui.button(
        [
          attribute.attribute("hx-post", "/sign-out"),
          attribute.attribute("hx-disable", "this"),
        ],
        [
          html.text("sign out"),
          ui.spinner(),
        ],
      ),
    ],
  )
}
