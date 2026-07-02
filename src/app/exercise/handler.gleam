import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/exercise/exercise
import app/exercise/ui
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

pub fn view_exercises_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let cursor =
    wisp.get_query(req)
    |> list.key_find("cursor")
    |> result.try(int.parse)
    |> option.from_result

  let is_htmx_request = request.get_header(req, "hx-request") == Ok("true")

  case exercise.select_page(ctx.db, user.id, cursor) {
    Ok(cursor) if is_htmx_request -> {
      cursor
      |> ui.exercises_rows()
      |> web.html(200)
    }
    Ok(cursor) ->
      cursor
      |> ui.exercises_list()
      |> ui.exercises_page(req)
      |> web.html(200)

    Error(db.DatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      wisp.internal_server_error()
    }

    Error(db.RowNotFound) -> wisp.internal_server_error()
  }
}

pub fn view_new_exercise_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- auth_session.require(req, ctx)

  ui.get_new_exercise_form()
  |> ui.new_exercise_form()
  |> ui.new_exercise_page(req)
  |> web.html(200)
}

type CreateExerciseError {
  CreateExerciseValidation(Form(ui.NewExerciseForm))
  CreateExerciseFailed(db.DatabaseError)
}

pub fn create_exercise(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(CreateExerciseValidation),
    )

    exercise.create(ctx.db, user.id, input.name)
    |> result.map_error(CreateExerciseFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/exercises")

    Error(CreateExerciseValidation(invalid_form)) ->
      invalid_form
      |> ui.new_exercise_form()
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
      |> ui.new_exercise_form()
      |> web.html(500)
    }

    Error(CreateExerciseFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_new_exercise_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_exercise_form()
      |> web.html(500)
    }

    Error(CreateExerciseFailed(db.RowNotFound)) -> wisp.internal_server_error()
  }
}
