import formal/form.{type Form}
import gleam/list
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
