import gym_graphs/schemas/sign_up_session_schema
import gym_graphs/views/sign_up_session_view
import lustre/element
import wisp

pub fn view_start_page() {
  sign_up_session_schema.parse_start()
  |> sign_up_session_view.register_form()
  |> sign_up_session_view.register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub fn start() {
  todo
}
