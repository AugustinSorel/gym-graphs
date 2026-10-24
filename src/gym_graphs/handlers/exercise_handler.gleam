import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/exercise_repo
import gym_graphs/repos/tag_repo
import gym_graphs/views/exercise_view
import lustre/element
import wisp.{type Request}

pub fn view_page(req: Request, user: User, ctx: Ctx) {
  let page_data = {
    use exercise_count <- result.try({
      exercise_repo.count_by_user_id(ctx.db, user.id)
    })

    use tags <- result.try(tag_repo.select_all_by_user_id(ctx.db, user.id))

    Ok(#(exercise_count, tags))
  }

  case page_data {
    Ok(#(exercise_count, tags)) ->
      exercise_view.page(exercise_count, tags, req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.error_page(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_new_page(req: Request, user: User, ctx: Ctx) {
  case tag_repo.select_all_by_user_id(ctx.db, user.id) {
    Ok(tags) ->
      exercise_view.new_page(tags, req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.new_page_error(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
