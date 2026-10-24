import gym_graphs/views/exercise_view
import lustre/element
import wisp.{type Request}

pub fn view_page(req: Request) {
  exercise_view.page(req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}
