import lustre/attribute
import lustre/element
import lustre/element/html
import wisp

pub type Context {
  Context(static_directory: String)
}

pub fn middleware(
  req: wisp.Request,
  ctx: Context,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let req = wisp.method_override(req)
  use <- wisp.log_request(req)
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)
  use req <- wisp.csrf_known_header_protection(req)

  use <- wisp.serve_static(req, under: "/static", from: ctx.static_directory)

  handle_request(req)
}

pub fn layout(children: element.Element(msg)) {
  html.html([attribute.lang("en")], [
    html.head([], [
      html.meta([attribute.charset("utf-8")]),
      html.meta([
        attribute.name("viewport"),
        attribute.content("width=device-width, initial-scale=1"),
      ]),
      html.link([
        attribute.href("/static/styles.css"),
        attribute.rel("stylesheet"),
      ]),
      html.script(
        [
          attribute.src("https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4"),
        ],
        "",
      ),
      html.title([], "auth"),
    ]),
    html.body([attribute.class("bg-surface text-on-surface p-4")], [
      children,
    ]),
  ])
}
