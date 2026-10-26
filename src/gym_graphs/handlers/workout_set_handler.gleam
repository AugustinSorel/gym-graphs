import gleam/bool
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/time/timestamp
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type User}
import gym_graphs/domains/weight
import gym_graphs/domains/workout_set.{type SetId}
import gym_graphs/repos/exercise_repo
import gym_graphs/repos/workout_set_repo
import gym_graphs/schemas/workout_set_schema.{
  type CreateSetsForm, type EditSetForm,
}
import gym_graphs/views/workout_set_view
import gym_graphs/web
import lustre/element
import pog
import wisp.{type Request}

type ViewNewError {
  ViewNewInvalidId
  ViewNewNotFound
  ViewNewDatabaseFailure(pog.QueryError)
}

pub fn view_new_page(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id) |> result.replace_error(ViewNewInvalidId),
    )
    use exercise <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewNewDatabaseFailure)
      |> result.try(option.to_result(_, ViewNewNotFound)),
    )
    use recent_sets <- result.try(
      workout_set_repo.select_page_by_exercise_id_and_user_id(
        ctx.db,
        id,
        user.id,
        workout_set.FirstPage,
        1,
      )
      |> result.map_error(ViewNewDatabaseFailure),
    )

    Ok(#(
      exercise.id,
      list.first(recent_sets)
        |> result.map(fn(set) { #(set.weight, set.repetitions) })
        |> result.unwrap(#(weight.from_grams(10_000), 1)),
    ))
  }

  case result {
    Ok(#(id, #(weight, reps))) -> {
      let form =
        workout_set_schema.prefilled(
          weight.display(weight, user.weight_unit).value,
          int.to_string(reps),
        )

      workout_set_view.new_page(form, id, user.weight_unit, req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(ViewNewInvalidId) ->
      workout_set_view.new_page_error(req.path, "invalid exercise id")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewNewNotFound) ->
      workout_set_view.new_page_error(req.path, "exercise not found")
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewNewDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.new_page_error(req.path, "something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

pub fn view_new_row(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id) |> result.replace_error(ViewNewInvalidId),
    )

    use Nil <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewNewDatabaseFailure)
      |> result.try(option.to_result(_, ViewNewNotFound))
      |> result.replace(Nil),
    )

    use recent_sets <- result.try(
      workout_set_repo.select_page_by_exercise_id_and_user_id(
        ctx.db,
        id,
        user.id,
        workout_set.FirstPage,
        1,
      )
      |> result.map_error(ViewNewDatabaseFailure),
    )

    list.first(recent_sets)
    |> result.map(fn(set) { #(set.repetitions, set.weight) })
    |> result.unwrap(#(1, weight.from_grams(10_000)))
    |> Ok
  }

  case result {
    Ok(#(reps, weight)) -> {
      let row =
        workout_set_schema.row(
          weight.display(weight, user.weight_unit).value,
          int.to_string(reps),
        )

      workout_set_view.new_set_row(0, row, user.weight_unit)
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(ViewNewInvalidId) -> {
      workout_set_view.new_set_row_error("invalid exercise id")
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(ViewNewNotFound) -> {
      workout_set_view.new_set_row_error("exercise not found")
      |> element.to_string()
      |> wisp.html_response(404)
    }
    Error(ViewNewDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.new_set_row_error("someting went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type CreateError {
  CreateNotFound
  CreateValidation(CreateSetsForm)
  CreateDatabaseFailure(pog.QueryError)
}

pub fn create(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  use formdata <- wisp.require_form(req)

  let validation = workout_set_schema.validate(formdata.values)
  let submitted_form = case validation {
    Ok(validated) -> validated.form
    Error(form) -> form
  }

  use id <- web.require_ok(
    parse_exercise_id(exercise_id)
    |> result.replace_error(
      workout_set_view.new_page_error(req.path, "invalid exercise id")
      |> element.to_string()
      |> wisp.html_response(422),
    ),
  )

  let result = {
    use _exercise <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(CreateDatabaseFailure)
      |> result.try(option.to_result(_, CreateNotFound)),
    )

    use validated <- result.try(
      validation |> result.map_error(CreateValidation),
    )

    workout_set_repo.create(
      ctx.db,
      id,
      list.map(validated.sets, fn(input) { input.repetitions }),
      list.map(validated.sets, fn(input) {
        weight.from_display_value(input.weight, user.weight_unit)
      }),
    )
    |> result.map_error(CreateDatabaseFailure)
    |> result.replace(id)
  }

  case result {
    Ok(id) ->
      wisp.created()
      |> wisp.set_header(
        "HX-Redirect",
        "/exercises/" <> int.to_string(id.value),
      )
    Error(CreateNotFound) ->
      workout_set_view.new_form(
        workout_set_schema.with_error(submitted_form, "Exercise not found."),
        id,
        user.weight_unit,
      )
      |> element.to_string()
      |> wisp.html_response(404)
    Error(CreateValidation(form)) ->
      workout_set_view.new_form(form, id, user.weight_unit)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(CreateDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.new_form(
        workout_set_schema.with_error(submitted_form, "Something went wrong."),
        id,
        user.weight_unit,
      )
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type ViewEditError {
  ViewEditInvalidId
  ViewEditNotFound
  ViewEditDatabaseFailure(pog.QueryError)
}

pub fn view_edit_page(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
  set_id: String,
) {
  let result = {
    use exercise_id <- result.try(
      parse_exercise_id(exercise_id) |> result.replace_error(ViewEditInvalidId),
    )
    use set_id <- result.try(
      parse_set_id(set_id) |> result.replace_error(ViewEditInvalidId),
    )
    use set <- result.try(
      workout_set_repo.select_by_id_and_exercise_id_and_user_id(
        ctx.db,
        set_id,
        exercise_id,
        user.id,
      )
      |> result.map_error(ViewEditDatabaseFailure)
      |> result.try(option.to_result(_, ViewEditNotFound)),
    )

    Ok(#(exercise_id, set))
  }

  case result {
    Ok(#(exercise_id, set)) -> {
      let weight.DisplayWeight(value:, unit: _) =
        weight.display(set.weight, user.weight_unit)
      let done_at =
        set.done_at
        |> timestamp.to_rfc3339(duration.seconds(0))
        |> string.slice(at_index: 0, length: 16)
      let form =
        workout_set_schema.edit_prefilled(
          value,
          int.to_string(set.repetitions),
          done_at,
        )

      workout_set_view.edit_page(
        form,
        exercise_id,
        set.id,
        user.weight_unit,
        req.path,
      )
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(ViewEditInvalidId) ->
      workout_set_view.edit_error_page(req.path, "invalid exercise or set id")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewEditNotFound) ->
      workout_set_view.edit_error_page(req.path, "set not found")
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewEditDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.edit_error_page(req.path, "something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type UpdateError {
  UpdateInvalidId
  UpdateValidation(EditSetForm)
  UpdateNotFound
  UpdateDatabaseFailure(pog.QueryError)
}

pub fn update(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
  set_id: String,
) {
  use formdata <- wisp.require_form(req)

  let validation = workout_set_schema.validate_edit(formdata.values)
  let submitted_form = case validation {
    Ok(validated) -> validated.form
    Error(form) -> form
  }
  let parsed_exercise_id = parse_exercise_id(exercise_id)
  let parsed_set_id = parse_set_id(set_id)

  let result = {
    use exercise_id <- result.try(
      parsed_exercise_id |> result.replace_error(UpdateInvalidId),
    )
    use set_id <- result.try(
      parsed_set_id |> result.replace_error(UpdateInvalidId),
    )
    use validated <- result.try(
      validation |> result.map_error(UpdateValidation),
    )

    workout_set_repo.update_by_id_and_exercise_id_and_user_id(
      ctx.db,
      set_id,
      exercise_id,
      user.id,
      validated.set.repetitions,
      weight.from_display_value(validated.set.weight, user.weight_unit),
      validated.set.done_at,
    )
    |> result.map_error(UpdateDatabaseFailure)
    |> result.try(option.to_result(_, UpdateNotFound))
    |> result.replace(exercise_id)
  }

  let exercise_id = parsed_exercise_id |> result.unwrap(exercise.ExerciseId(0))
  let set_id = parsed_set_id |> result.unwrap(workout_set.SetId(0))

  case result {
    Ok(exercise_id) ->
      wisp.ok()
      |> wisp.set_header(
        "HX-Redirect",
        "/exercises/" <> int.to_string(exercise_id.value),
      )
    Error(UpdateInvalidId) ->
      workout_set_view.edit_form(
        workout_set_schema.edit_with_error(
          submitted_form,
          "Invalid exercise or set id.",
        ),
        exercise_id,
        set_id,
        user.weight_unit,
      )
      |> element.to_string()
      |> wisp.html_response(422)
    Error(UpdateValidation(form)) ->
      workout_set_view.edit_form(form, exercise_id, set_id, user.weight_unit)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(UpdateNotFound) ->
      workout_set_view.edit_form(
        workout_set_schema.edit_with_error(submitted_form, "Set not found."),
        exercise_id,
        set_id,
        user.weight_unit,
      )
      |> element.to_string()
      |> wisp.html_response(404)
    Error(UpdateDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      workout_set_view.edit_form(
        workout_set_schema.edit_with_error(
          submitted_form,
          "Something went wrong.",
        ),
        exercise_id,
        set_id,
        user.weight_unit,
      )
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

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
