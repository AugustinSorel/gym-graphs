import gleam/bool
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type User}
import gym_graphs/domains/workout_set.{type SetId}
import gym_graphs/repos/workout_set_repo
import gym_graphs/views/workout_set_view
import lustre/element
import pog
import wisp.{type Request}

type ViewRemovePageError {
  ViewRemovePageInvalidId
  ViewRemovePageNotFound
  ViewRemovePageDatabaseFailure(pog.QueryError)
}

pub fn view_remove_page(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
  set_id: String,
) {
  let result = {
    use exercise_id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(ViewRemovePageInvalidId),
    )

    use set_id <- result.try(
      parse_set_id(set_id)
      |> result.replace_error(ViewRemovePageInvalidId),
    )

    use set <- result.try(
      workout_set_repo.select_by_id_and_exercise_id_and_user_id(
        ctx.db,
        set_id,
        exercise_id,
        user.id,
      )
      |> result.map_error(ViewRemovePageDatabaseFailure)
      |> result.try(option.to_result(_, ViewRemovePageNotFound)),
    )

    Ok(#(exercise_id, set.id))
  }

  case result {
    Ok(#(exercise_id, set_id)) ->
      workout_set_view.remove_form(exercise_id, set_id)
      |> workout_set_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(ViewRemovePageInvalidId) ->
      workout_set_view.remove_error("invalid exercise or set id")
      |> workout_set_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewRemovePageNotFound) ->
      workout_set_view.remove_error("set not found")
      |> workout_set_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewRemovePageDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.remove_error("something went wrong")
      |> workout_set_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type RemoveError {
  RemoveInvalidId
  RemoveNotFound
  RemoveDatabaseFailure(pog.QueryError)
}

pub fn remove(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
  set_id: String,
) {
  let result = {
    use exercise_id <- result.try(
      parse_exercise_id(exercise_id) |> result.replace_error(RemoveInvalidId),
    )

    use set_id <- result.try(
      parse_set_id(set_id) |> result.replace_error(RemoveInvalidId),
    )

    use Nil <- result.try(
      workout_set_repo.delete_by_id_and_exercise_id_and_user_id(
        ctx.db,
        set_id,
        exercise_id,
        user.id,
      )
      |> result.map_error(RemoveDatabaseFailure)
      |> result.try(option.to_result(_, RemoveNotFound))
      |> result.replace(Nil),
    )

    Ok(exercise_id)
  }

  case result {
    Ok(exercise_id) ->
      wisp.ok()
      |> wisp.set_header(
        "HX-Redirect",
        "/exercises/" <> int.to_string(exercise_id.value),
      )
    Error(RemoveInvalidId) ->
      workout_set_view.remove_error("invalid exercise or set id")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(RemoveNotFound) ->
      workout_set_view.remove_error("set not found")
      |> element.to_string()
      |> wisp.html_response(404)
    Error(RemoveDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.remove_error("something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

fn parse_exercise_id(value: String) -> Result(ExerciseId, Nil) {
  use id <- result.try(parse_positive_id(value))
  Ok(exercise.ExerciseId(id))
}

fn parse_set_id(value: String) -> Result(SetId, Nil) {
  use id <- result.try(parse_positive_id(value))
  Ok(workout_set.SetId(id))
}

fn parse_positive_id(value: String) -> Result(Int, Nil) {
  use id <- result.try(int.parse(value) |> result.replace_error(Nil))
  use <- bool.guard(when: id <= 0, return: Error(Nil))
  Ok(id)
}
