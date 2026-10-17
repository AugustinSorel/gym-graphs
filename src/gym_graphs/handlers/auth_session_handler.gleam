import gym_graphs/schemas/auth_session_schema
import gym_graphs/views/auth_session_view
import lustre/element
import wisp

pub fn view_sign_in_page() {
  auth_session_schema.sign_in()
  |> auth_session_view.sign_in_form()
  |> auth_session_view.sign_in_page()
  |> element.to_string()
  |> wisp.html_response(200)
}
