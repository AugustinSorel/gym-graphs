import app/sign_up/sign_up_form
import app/sign_up/sign_up_ui
import app/web
import formal/form
import gleam/result
import lustre/element
import wisp.{type Request}

pub fn view_form() {
  sign_up_ui.form_page()
  |> element.to_string
  |> wisp.html_response(wisp.ok().status)
}

pub fn create_session(req: Request) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    sign_up_form.create()
    |> form.add_values(formdata.values)
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> sign_up_ui.form
      |> element.to_string
      |> wisp.html_response(422)
    })

  use form <- web.require_ok(candidate_form)

  echo form

  wisp.redirect(to: "/")
}
