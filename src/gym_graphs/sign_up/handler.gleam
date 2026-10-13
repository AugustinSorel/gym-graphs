import gym_graphs/sign_up/schema
import gym_graphs/sign_up/view
import lustre/element
import wisp

pub fn view_start_page() {
  schema.email_register()
  |> view.register_form()
  |> view.register_page()
  |> element.to_string()
  |> wisp.html_response(200)
}

pub fn start() {
  todo
}
