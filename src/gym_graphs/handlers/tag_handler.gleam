import gym_graphs/views/tag_view
import lustre/element
import wisp.{type Request}

pub fn view_create_page(req: Request) {
  tag_view.create_tag_form()
  |> tag_view.create_tag_page(req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}
