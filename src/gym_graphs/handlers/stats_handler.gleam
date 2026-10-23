import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/stats_repo
import gym_graphs/views/stats_view
import lustre/element
import wisp.{type Request}

pub fn view_page(req: Request, user: User, ctx: Ctx) {
  case stats_repo.select_weekly_summary(ctx.db, user.id) {
    Ok(summary) ->
      stats_view.page(summary, user.weight_unit, req.path)
      |> element.to_string()
      |> wisp.html_response(200)

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      stats_view.error_page(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
