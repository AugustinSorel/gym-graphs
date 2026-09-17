import app/web
import features/sign_in/ui

pub fn view_page() {
  ui.get_sign_in_form()
  |> ui.sign_in_form()
  |> ui.sign_in_page()
  |> web.send_html(200)
}
