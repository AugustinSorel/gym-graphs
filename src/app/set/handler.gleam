import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/exercise/exercise
import app/set/set
import app/set/ui
import app/web
import formal/form.{type Form}
import gleam/int
import gleam/result
import gleam/string
import wisp.{type Request, type Response}

type ViewNewSetPageError {
  ViewNewSetInvalidExerciseId
  ViewNewSetExerciseNotFound(db.DatabaseError)
}

pub fn view_new_set_page(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(
      int.parse(exercise_id)
      |> result.replace_error(ViewNewSetInvalidExerciseId),
    )

    exercise.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(ViewNewSetExerciseNotFound)
  }

  case result {
    Error(ViewNewSetInvalidExerciseId) ->
      ui.get_new_set_form()
      |> ui.new_set_form(exercise_id)
      |> ui.new_set_page(req)
      |> web.html(422)

    Error(ViewNewSetExerciseNotFound(db.RowNotFound)) ->
      ui.get_new_set_form()
      |> ui.new_set_form(exercise_id)
      |> ui.new_set_page(req)
      |> web.html(404)

    Error(ViewNewSetExerciseNotFound(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form()
      |> ui.new_set_form(exercise_id)
      |> ui.new_set_page(req)
      |> web.html(500)
    }

    Ok(_exercise) ->
      ui.get_new_set_form()
      |> ui.new_set_form(exercise_id)
      |> ui.new_set_page(req)
      |> web.html(200)
  }
}

type CreateSetError {
  CreateSetInvalidExerciseId
  CreateSetExerciseNotFound(db.DatabaseError)
  CreateSetValidation(Form(ui.NewSetForm))
  CreateSetFailed(db.DatabaseError)
}

pub fn create_set(req: Request, ctx: Ctx, exercise_id: String) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use id <- result.try(
      int.parse(exercise_id)
      |> result.replace_error(CreateSetInvalidExerciseId),
    )

    use exercise <- result.try(
      exercise.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(CreateSetExerciseNotFound),
    )

    use input <- result.try(
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(CreateSetValidation),
    )

    set.create(ctx.db, exercise.id, input.repetitions, input.weight_in_g)
    |> result.map_error(CreateSetFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/exercises/" <> exercise_id)

    Error(CreateSetInvalidExerciseId) ->
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("invalid exercise id"))
      |> ui.new_set_form(exercise_id)
      |> web.html(422)

    Error(CreateSetExerciseNotFound(db.RowNotFound)) ->
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("exercise not found"))
      |> ui.new_set_form(exercise_id)
      |> web.html(404)

    Error(CreateSetExerciseNotFound(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id)
      |> web.html(500)
    }

    Error(CreateSetValidation(invalid_form)) ->
      invalid_form
      |> ui.new_set_form(exercise_id)
      |> web.html(422)

    Error(CreateSetFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id)
      |> web.html(500)
    }

    Error(CreateSetFailed(db.RowNotFound)) -> {
      ui.get_new_set_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id)
      |> web.html(500)
    }
  }
}
