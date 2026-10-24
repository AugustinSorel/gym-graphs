import formal/form.{type Form}
import gleam/bool
import gleam/http/request
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/exercise_repo
import gym_graphs/repos/tag_repo
import gym_graphs/schemas/exercise_schema.{type CreateExerciseSchema}
import gym_graphs/views/exercise_view
import lustre/element
import pog
import wisp.{type Request}

const exercises_page_size = 20

pub fn view_page(req: Request, user: User, ctx: Ctx) {
  let filter_tag_ids = filter_tag_ids(req)

  let page_data = {
    use exercise_count <- result.try({
      exercise_repo.count_by_user_id(ctx.db, user.id)
    })

    use tags <- result.try(tag_repo.select_all_by_user_id(ctx.db, user.id))

    use exercises_page <- result.try({
      load_exercises_page(user, 0, filter_tag_ids, ctx)
    })

    Ok(#(exercise_count, tags, exercises_page))
  }

  case page_data {
    Ok(#(exercise_count, tags, exercises_page)) -> {
      let content = case request.get_header(req, "hx-request") {
        Ok("true") -> exercise_view.exercises_table(exercises_page)
        _ ->
          exercise_view.page(
            exercise_count,
            tags,
            filter_tag_ids,
            exercises_page,
            req.path,
          )
      }

      content |> element.to_string() |> wisp.html_response(200)
    }
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.error_page(req.path, "something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub type ViewRowsError {
  InvalidCursor
  ViewRowsDatabaseFailure(pog.QueryError)
}

pub fn view_rows(req: Request, user: User, ctx: Ctx) {
  let filter_tag_ids = filter_tag_ids(req)

  let result = {
    use cursor_query <- result.try(
      wisp.get_query(req)
      |> list.key_find("cursor")
      |> result.replace_error(InvalidCursor),
    )

    use cursor <- result.try(
      int.parse(cursor_query) |> result.replace_error(InvalidCursor),
    )

    use <- bool.guard(when: cursor <= 0, return: Error(InvalidCursor))

    load_exercises_page(user, cursor, filter_tag_ids, ctx)
    |> result.map_error(ViewRowsDatabaseFailure)
  }

  case result {
    Ok(exercises_page) ->
      exercises_page
      |> exercise_view.exercise_rows()
      |> element.to_string()
      |> wisp.html_response(200)
    Error(InvalidCursor) ->
      exercise_view.exercise_rows_error("invalid cursor")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewRowsDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.exercise_rows_error("something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

fn load_exercises_page(
  user: User,
  before_id: Int,
  filter_tag_ids: List(Int),
  ctx: Ctx,
) {
  use fetched_rows <- result.try({
    exercise_repo.select_page_by_user_id(
      ctx.db,
      user.id,
      before_id,
      filter_tag_ids,
      exercises_page_size + 1,
    )
  })

  let has_next_page = list.length(fetched_rows) > exercises_page_size
  let rows = list.take(fetched_rows, exercises_page_size)

  let next_cursor = case has_next_page, list.last(rows) {
    True, Ok(last_exercise) -> option.Some(last_exercise.id)
    _, _ -> option.None
  }

  Ok(exercise_view.ExercisesPage(rows:, next_cursor:, filter_tag_ids:))
}

fn filter_tag_ids(req: Request) -> List(Int) {
  wisp.get_query(req)
  |> list.filter_map(fn(query) {
    case query {
      #("filter_tag_ids", value) ->
        case int.parse(value) {
          Ok(id) if id > 0 -> Ok(id)
          _ -> Error(Nil)
        }
      _ -> Error(Nil)
    }
  })
  |> list.unique()
}

type ViewDetailPageError {
  ViewDetailPageInvalidId
  ViewDetailPageNotFound
  ViewDetailPageDatabaseFailure(pog.QueryError)
}

pub fn view_detail_page(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(ViewDetailPageInvalidId),
    )

    exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(ViewDetailPageDatabaseFailure)
    |> result.try(option.to_result(_, ViewDetailPageNotFound))
  }

  case result {
    Ok(selected_exercise) ->
      exercise_view.detail_page(selected_exercise, req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(ViewDetailPageInvalidId) -> {
      exercise_view.error_page(req.path, "invalid exercise id.")
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(ViewDetailPageNotFound) -> {
      exercise_view.error_page(req.path, "exercise not found.")
      |> element.to_string()
      |> wisp.html_response(404)
    }
    Error(ViewDetailPageDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.error_page(req.path, "Something went wrong.")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

fn parse_exercise_id(value: String) -> Result(ExerciseId, Nil) {
  use id <- result.try(int.parse(value) |> result.replace_error(Nil))
  use <- bool.guard(when: id <= 0, return: Error(Nil))

  Ok(exercise.ExerciseId(id))
}

pub fn view_new_page(req: Request, user: User, ctx: Ctx) {
  case tag_repo.select_all_by_user_id(ctx.db, user.id) {
    Ok(tags) ->
      exercise_schema.create()
      |> exercise_view.new_page(tags, req.path)
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

type CreateError {
  CreateValidation(Form(CreateExerciseSchema))
  CreateDatabaseFailure(pog.QueryError)
}

pub fn create(req: Request, user: User, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  case tag_repo.select_all_by_user_id(ctx.db, user.id) {
    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_schema.create()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> exercise_view.new_form([])
      |> element.to_string()
      |> wisp.html_response(500)
    }
    Ok(tags) -> {
      let result = {
        use input <- result.try(
          exercise_schema.create()
          |> form.add_values(formdata.values)
          |> form.run()
          |> result.map_error(CreateValidation),
        )

        exercise_repo.create(
          ctx.db,
          user.id,
          input.name,
          list.unique(input.tag_ids),
        )
        |> result.map_error(CreateDatabaseFailure)
      }

      case result {
        Ok(_) ->
          wisp.created()
          |> wisp.set_header("HX-Redirect", "/exercises")
        Error(CreateValidation(form)) ->
          form
          |> exercise_view.new_form(tags)
          |> element.to_string()
          |> wisp.html_response(422)
        Error(CreateDatabaseFailure(pog.ConstraintViolated(
          _,
          "exercises_user_id_name_key",
          _,
        ))) ->
          exercise_schema.create()
          |> form.add_values(formdata.values)
          |> form.add_error(
            "root",
            form.CustomError("Exercise name is already used."),
          )
          |> exercise_view.new_form(tags)
          |> element.to_string()
          |> wisp.html_response(409)
        Error(CreateDatabaseFailure(error)) -> {
          wisp.log_error(req.path <> " " <> string.inspect(error))
          exercise_schema.create()
          |> form.add_values(formdata.values)
          |> form.add_error("root", form.CustomError("Something went wrong."))
          |> exercise_view.new_form(tags)
          |> element.to_string()
          |> wisp.html_response(500)
        }
      }
    }
  }
}
