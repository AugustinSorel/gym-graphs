import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/exercise/exercise
import app/set/set
import app/set/ui
import app/ui as app_ui
import app/user/user
import app/web
import formal/form.{type Form}
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import wisp.{type Request, type Response}

pub type ViewNewSetRowError {
  ViewNewSetRowInvalidId
  SelectingLastSetFailed(db.ExtractOptionalError)
}

pub fn view_new_set_row(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(
      int.parse(exercise_id) |> result.replace_error(ViewNewSetRowInvalidId),
    )

    use latest_set <- result.try(
      set.select_latest(ctx.db, id) |> result.map_error(SelectingLastSetFailed),
    )

    option.map(latest_set, fn(a) {
      let weight =
        user.grams_to_unit(a.weight_in_g, user.weight_unit)
        |> app_ui.display_weight_value()

      [
        #("weight", weight),
        #("repetitions", int.to_string(a.repetitions)),
      ]
    })
    |> option.unwrap([])
    |> Ok
  }

  case result {
    Ok(values) -> {
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(values)
      |> ui.new_set_row(user.weight_unit)
      |> web.html(200)
    }

    Error(ViewNewSetRowInvalidId) -> {
      ui.get_new_set_form(user.weight_unit)
      |> form.add_error("root", form.CustomError("invalid exercise id"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(422)
    }

    Error(SelectingLastSetFailed(db.ExtractOptionalError(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_new_set_form(user.weight_unit)
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(500)
    }
  }
}

type ViewNewSetPageError {
  ViewNewSetInvalidExerciseId
  ViewNewSetExerciseNotFound(db.DatabaseError)
  SelectLastestSetFailed(db.ExtractOptionalError)
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

    use exercise <- result.try(
      exercise.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewNewSetExerciseNotFound),
    )

    use latest_set <- result.try(
      set.select_latest(ctx.db, exercise.id)
      |> result.map_error(SelectLastestSetFailed),
    )

    option.map(latest_set, fn(a) {
      let weight =
        user.grams_to_unit(a.weight_in_g, user.weight_unit)
        |> app_ui.display_weight_value()

      [
        #("weight", weight),
        #("repetitions", int.to_string(a.repetitions)),
      ]
    })
    |> option.unwrap([])
    |> Ok
  }

  case result {
    Error(ViewNewSetInvalidExerciseId) ->
      ui.get_new_set_form(user.weight_unit)
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(422)

    Error(ViewNewSetExerciseNotFound(db.RowNotFound)) ->
      ui.get_new_set_form(user.weight_unit)
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(404)

    Error(ViewNewSetExerciseNotFound(db.DatabaseFailure(err)))
    | Error(SelectLastestSetFailed(db.ExtractOptionalError(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form(user.weight_unit)
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(500)
    }

    Ok(values) -> {
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(values)
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> ui.new_set_page(req)
      |> web.html(200)
    }
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
      ui.get_new_set_form(user.weight_unit)
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
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("invalid exercise id"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(422)

    Error(CreateSetExerciseNotFound(db.RowNotFound)) ->
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("exercise not found"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(404)

    Error(CreateSetExerciseNotFound(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(500)
    }

    Error(CreateSetValidation(invalid_form)) ->
      invalid_form
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(422)

    Error(CreateSetFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(500)
    }

    Error(CreateSetFailed(db.RowNotFound)) -> {
      ui.get_new_set_form(user.weight_unit)
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_set_form(exercise_id, user.weight_unit)
      |> web.html(500)
    }
  }
}
