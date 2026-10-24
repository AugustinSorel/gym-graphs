import formal/form.{type Form}
import gleam/bool
import gleam/erlang/process
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
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
  let page_data = {
    use exercise_count <- result.try({
      exercise_repo.count_by_user_id(ctx.db, user.id)
    })

    use tags <- result.try(tag_repo.select_all_by_user_id(ctx.db, user.id))

    use exercises_page <- result.try(load_exercises_page(user, 0, ctx))

    Ok(#(exercise_count, tags, exercises_page))
  }

  case page_data {
    Ok(#(exercise_count, tags, exercises_page)) ->
      exercise_view.page(exercise_count, tags, exercises_page, req.path)
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

pub type ViewRowsError {
  InvalidCursor
  ViewRowsDatabaseFailure(pog.QueryError)
}

pub fn view_rows(req: Request, user: User, ctx: Ctx) {
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

    load_exercises_page(user, cursor, ctx)
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

fn load_exercises_page(user: User, before_id: Int, ctx: Ctx) {
  use fetched_rows <- result.try({
    exercise_repo.select_page_by_user_id(
      ctx.db,
      user.id,
      before_id,
      exercises_page_size + 1,
    )
  })

  let has_next_page = list.length(fetched_rows) > exercises_page_size
  let rows = list.take(fetched_rows, exercises_page_size)

  let next_cursor = case has_next_page, list.last(rows) {
    True, Ok(last_exercise) -> option.Some(last_exercise.id)
    _, _ -> option.None
  }

  Ok(exercise_view.ExercisesPage(rows:, next_cursor:))
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
