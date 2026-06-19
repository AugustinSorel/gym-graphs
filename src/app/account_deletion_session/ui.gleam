import app/ui
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

// ---------------------------------------------------------------------------
// Confirm deletion page
// ---------------------------------------------------------------------------

pub fn confirm_page() -> Element(a) {
  ui.layout(
    html.main(
      [attribute.class("grid lg:grid-cols-[1fr_auto_1fr] min-h-screen")],
      [
        html.section(
          [
            attribute.class("bg-surface-container-highest hidden lg:block"),
            attribute.aria_hidden(True),
          ],
          [],
        ),
        html.hr([attribute.class("bg-current w-1 h-full hidden lg:block")]),
        html.section(
          [attribute.class("max-w-xl w-full m-auto space-y-15 p-4")],
          [
            html.h1([attribute.class("text-5xl text-center")], [
              html.text("Delete your account"),
            ]),
            confirm_form(),
          ],
        ),
      ],
    ),
  )
}

pub fn confirm_form() -> Element(a) {
  html.form(
    [
      attribute.attribute("hx-post", "/delete-account/confirm"),
      attribute.attribute("hx-disable", "find button[type='submit']"),
      attribute.attribute("hx-indicator", "find button[type='submit']"),
    ],
    [
      html.fieldset(
        [attribute.class("border-2 border-current flex flex-col p-10 gap-10")],
        [
          html.legend([attribute.class("text-sm border-2 px-4 py-1")], [
            html.text("confirm account deletion"),
          ]),
          html.p([attribute.class("text-sm")], [
            html.text(
              "This action is permanent and cannot be undone. All your data will be deleted.",
            ),
          ]),
          ui.button(ui.ButtonDestroy, [attribute.type_("submit")], [
            html.text("yes, delete my account"),
            ui.spinner(),
          ]),
          html.div([attribute.class("flex justify-end")], [
            ui.button(
              ui.ButtonLink,
              [
                attribute.type_("button"),
                attribute.attribute("hx-post", "/delete-account/cancel"),
                attribute.attribute("hx-disable", "this"),
              ],
              [html.text("cancel"), ui.spinner()],
            ),
          ]),
        ],
      ),
    ],
  )
}
