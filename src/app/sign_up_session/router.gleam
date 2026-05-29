import app/sign_up_session/ui
import app/web
import formal/form
import gleam/result
import wisp.{type Request}

pub fn view_create_sign_up_session_page() {
  ui.create_sign_up_session_page()
  |> web.html(200)
}

pub fn create_sign_up_session(req: Request) {
  use formdata <- wisp.require_form(req)

  let candidate_form =
    ui.get_sign_up_session_form()
    |> form.add_values(formdata.values)
    |> form.run()
    |> result.map_error(fn(form) {
      form
      |> ui.create_sign_up_session_form
      |> web.html(wisp.unprocessable_content().status)
    })

  use form <- web.require_ok(candidate_form)

  echo form

  wisp.redirect(to: "/")
}
