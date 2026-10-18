import gym_graphs/domains/user.{type User}
import gym_graphs/views/user_view
import lustre/element
import wisp.{type Request}

pub fn view_account_page(req: Request, user: User) {
  user_view.account_details(user)
  |> user_view.account_page(req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}
