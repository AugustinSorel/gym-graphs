import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/exercise/exercise
import app/exercise/ui
import app/tag/tag
import app/web
import formal/form.{type Form}
import gleam/http/request
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import pog
import wisp.{type Request, type Response}

type ViewExercisesPageError {
  SelectExercisesPageFailed(db.ExtractRowsError)
  CountingExercisesFailed(db.DatabaseError)
}

pub fn view_exercises_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let query_params = wisp.get_query(req)

  let search_query =
    query_params
    |> list.key_find("q")
    |> result.unwrap("")

  let cursor =
    query_params
    |> list.key_find("cursor")
    |> result.try(int.parse)
    |> option.from_result

  let is_htmx_request = request.get_header(req, "hx-request") == Ok("true")

  let result = {
    use page <- result.try({
      exercise.select_page(ctx.db, user.id, cursor, search_query)
      |> result.map_error(SelectExercisesPageFailed)
    })

    use count <- result.try(
      exercise.count(ctx.db, user.id, search_query)
      |> result.map_error(CountingExercisesFailed),
    )

    Ok(#(page, count))
  }

  let replace_url = case string.is_empty(search_query) {
    True -> "/exercises"
    False -> "/exercises?q=" <> search_query
  }

  case result {
    Ok(#(page, _)) if is_htmx_request ->
      page
      |> ui.exercises_rows(search_query, user)
      |> web.html(200)
      |> wisp.set_header("HX-Replace-Url", replace_url)

    Ok(#(page, exercises_count)) ->
      page
      |> ui.exercises_list(exercises_count, search_query, user)
      |> ui.exercises_page(req)
      |> web.html(200)

    Error(SelectExercisesPageFailed(db.ExtractRowsFailure(error)))
    | Error(CountingExercisesFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.exercises_list_error("something went wrong")
      |> ui.exercises_page(req)
      |> web.html(500)
    }
    Error(CountingExercisesFailed(db.RowNotFound) as e) -> {
      wisp.log_error(req.path <> " " <> string.inspect(e))
      ui.exercises_list_error("something went wrong")
      |> ui.exercises_page(req)
      |> web.html(500)
    }
  }
}

pub fn view_new_exercise_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  case tag.select_by_user_id(ctx.db, user.id) {
    Ok(tags) ->
      ui.get_new_exercise_form()
      |> ui.new_exercise_form(tags)
      |> ui.new_exercise_page(req)
      |> web.html(200)

    Error(db.ExtractRowsFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      wisp.internal_server_error()
    }
  }
}

type ViewRenameExercisePageError {
  ViewRenameInvalidId
  ViewRenameSelectFailed(db.DatabaseError)
}

pub fn view_rename_exercise_page(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(
      int.parse(exercise_id) |> result.replace_error(ViewRenameInvalidId),
    )

    exercise.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(ViewRenameSelectFailed)
  }

  case result {
    Error(ViewRenameInvalidId) ->
      ui.get_rename_exercise_form()
      |> form.add_error("root", form.CustomError("invalid exercise id"))
      |> ui.rename_exercise_form(exercise_id)
      |> ui.rename_exercise_page(req)
      |> web.html(422)

    Error(ViewRenameSelectFailed(db.RowNotFound)) ->
      ui.get_rename_exercise_form()
      |> form.add_error("root", form.CustomError("exercise not found"))
      |> ui.rename_exercise_form(exercise_id)
      |> ui.rename_exercise_page(req)
      |> web.html(404)

    Error(ViewRenameSelectFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_rename_exercise_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.rename_exercise_form(exercise_id)
      |> ui.rename_exercise_page(req)
      |> web.html(500)
    }

    Ok(ex) ->
      ui.get_rename_exercise_form()
      |> form.add_values([#("name", ex.name)])
      |> ui.rename_exercise_form(exercise_id)
      |> ui.rename_exercise_page(req)
      |> web.html(200)
  }
}

type RenameExerciseError {
  RenameExerciseInvalidId
  RenameExerciseValidation(Form(ui.RenameExerciseForm))
  RenameExerciseFailed(db.DatabaseError)
}

pub fn rename_exercise(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use id <- result.try(
      int.parse(exercise_id) |> result.replace_error(RenameExerciseInvalidId),
    )

    use input <- result.try(
      ui.get_rename_exercise_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(RenameExerciseValidation),
    )

    exercise.rename(ctx.db, id, user.id, input.name)
    |> result.map_error(RenameExerciseFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) -> wisp.ok() |> wisp.set_header("HX-Redirect", "/exercises")

    Error(RenameExerciseInvalidId) ->
      ui.get_rename_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("invalid exercise id"))
      |> ui.rename_exercise_form(exercise_id)
      |> web.html(422)

    Error(RenameExerciseValidation(invalid_form)) ->
      invalid_form
      |> ui.rename_exercise_form(exercise_id)
      |> web.html(422)

    Error(RenameExerciseFailed(db.RowNotFound)) ->
      ui.get_rename_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("exercise not found"))
      |> ui.rename_exercise_form(exercise_id)
      |> web.html(404)

    Error(RenameExerciseFailed(db.DatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: _,
      detail: _,
    )))) ->
      ui.get_rename_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("exercise name is already used"),
      )
      |> ui.rename_exercise_form(exercise_id)
      |> web.html(422)

    Error(RenameExerciseFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_rename_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.rename_exercise_form(exercise_id)
      |> web.html(500)
    }
  }
}

type ViewRemoveExercisePageError {
  ViewRemoveInvalidId
  ViewRemoveSelectFailed(db.DatabaseError)
}

pub fn view_remove_exercise_page(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(
      int.parse(exercise_id) |> result.replace_error(ViewRemoveInvalidId),
    )

    exercise.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(ViewRemoveSelectFailed)
  }

  case result {
    Error(ViewRemoveInvalidId) ->
      "invalid exercise id"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(422)

    Error(ViewRemoveSelectFailed(db.RowNotFound)) ->
      "exercise not found"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(404)

    Error(ViewRemoveSelectFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      "something went wrong"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(500)
    }

    Ok(ex) ->
      ui.remove_exercise_dialog(ex)
      |> ui.remove_exercise_page(req)
      |> web.html(200)
  }
}

type RemoveExerciseError {
  RemoveExerciseInvalidId
  RemoveExerciseFailed(db.DatabaseError)
}

pub fn remove_exercise(
  req: Request,
  ctx: Ctx,
  exercise_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(
      int.parse(exercise_id) |> result.replace_error(RemoveExerciseInvalidId),
    )

    exercise.delete(ctx.db, id, user.id)
    |> result.map_error(RemoveExerciseFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) -> wisp.ok() |> wisp.set_header("HX-Redirect", "/exercises")

    Error(RemoveExerciseInvalidId) ->
      "invalid exercise id"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(422)

    Error(RemoveExerciseFailed(db.RowNotFound)) ->
      "exercise not found"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(404)

    Error(RemoveExerciseFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      "something went wrong"
      |> ui.remove_exercise_alert()
      |> ui.remove_exercise_page(req)
      |> web.html(500)
    }
  }
}

type CreateExerciseError {
  CreateExerciseValidation(Form(ui.NewExerciseForm))
  CreateExerciseFailed(db.DatabaseError)
  AttachTagsFailed(db.ExtractRowsError)
}

pub fn create_exercise(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let tags = tag.select_by_user_id(ctx.db, user.id) |> result.unwrap([])

  let tag_ids =
    form_data.values
    |> list.filter_map(fn(pair) {
      let #(_, value) = pair
      int.parse(value)
    })

  let result = {
    use input <- result.try(
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(CreateExerciseValidation),
    )

    use created <- result.try(
      exercise.create(ctx.db, user.id, input.name)
      |> result.map_error(CreateExerciseFailed),
    )

    exercise.attach_tags(ctx.db, created.id, tag_ids)
    |> result.map_error(AttachTagsFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/exercises")

    Error(CreateExerciseValidation(invalid_form)) ->
      invalid_form
      |> ui.new_exercise_form(tags)
      |> web.html(422)

    Error(CreateExerciseFailed(db.DatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: _,
      detail: _,
    )))) -> {
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error(
        "root",
        form.CustomError("exercise name is already used"),
      )
      |> ui.new_exercise_form(tags)
      |> web.html(500)
    }

    Error(CreateExerciseFailed(db.DatabaseFailure(error)))
    | Error(AttachTagsFailed(db.ExtractRowsFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_exercise_form(tags)
      |> web.html(500)
    }

    Error(CreateExerciseFailed(db.RowNotFound)) -> {
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_exercise_form(tags)
      |> web.html(500)
    }
  }
}
