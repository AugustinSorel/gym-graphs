import gym_graphs/domains/user.{type User}
import gym_graphs/views/stats_view
import lustre/element
import wisp.{type Request}

pub fn view_page(req: Request, user: User) {
  stats_view.page(user.weight_unit, req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}
