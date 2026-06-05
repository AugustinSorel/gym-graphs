import app/features/reset_password/ui
import app/web

pub fn view() {
  ui.get_form()
  |> ui.form()
  |> ui.page()
  |> web.html(200)
}
