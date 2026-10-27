import gym_graphs/views/home_view
import lustre/element
import wisp

pub fn view_page() {
  home_view.page()
  |> element.to_string()
  |> wisp.html_response(200)
}
