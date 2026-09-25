import identity/presentation/sign_up/forms
import identity/presentation/sign_up/ui
import lustre/element
import wisp

pub fn view_start_page() {
  forms.email_register()
  |> ui.email_register_form()
  |> ui.email_register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}
