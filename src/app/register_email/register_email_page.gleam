import app/register_email/register_email_ui
import app/web

//TODO: protect routes
pub fn view_page() {
  register_email_ui.get_form()
  |> register_email_ui.form()
  |> register_email_ui.page()
  |> web.html(200)
}
