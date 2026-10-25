import formal/form.{type Form}
import gleam/bool
import gleam/http/request
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/time/timestamp
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/exercise.{type ExerciseId}
import gym_graphs/domains/user.{type User}
import gym_graphs/domains/workout_set
import gym_graphs/repos/exercise_repo
import gym_graphs/repos/tag_repo
import gym_graphs/repos/workout_set_repo
import gym_graphs/schemas/exercise_schema.{
  type CreateExerciseSchema, type RenameExerciseSchema,
  type UpdateExerciseTagsSchema,
}
import gym_graphs/views/exercise_view
import gym_graphs/web
import lustre/element
import pog
import wisp.{type Request}

const exercises_page_size = 20

const sets_page_size = 10

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

    use selected_exercise_option <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewDetailPageDatabaseFailure),
    )
    use selected_exercise <- result.try(option.to_result(
      selected_exercise_option,
      ViewDetailPageNotFound,
    ))

    use facts <- result.try(
      exercise_repo.select_facts_by_id_and_user_id(
        ctx.db,
        id,
        user.id,
        user.one_rep_max_algorithm,
      )
      |> result.map_error(ViewDetailPageDatabaseFailure),
    )

    use all_tags <- result.try(
      tag_repo.select_all_by_user_id(ctx.db, user.id)
      |> result.map_error(ViewDetailPageDatabaseFailure),
    )
    use selected_tags <- result.try(
      tag_repo.select_by_exercise_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewDetailPageDatabaseFailure),
    )
    use sets_page <- result.try(
      load_sets_page(user, id, workout_set.FirstPage, facts.total_sets, ctx)
      |> result.map_error(ViewDetailPageDatabaseFailure),
    )

    Ok(#(selected_exercise, facts, sets_page, all_tags, selected_tags))
  }

  case result {
    Ok(#(selected_exercise, facts, sets_page, all_tags, selected_tags)) ->
      exercise_view.detail_page(
        [
          exercise_view.detail_header(selected_exercise, facts.total_sets),
          exercise_view.exercise_facts(facts, user.weight_unit),
          exercise_view.exercise_sets(sets_page),
          exercise_view.exercise_tags(
            selected_exercise.id,
            all_tags,
            selected_tags,
          ),
          exercise_view.exercise_manage(selected_exercise),
        ],
        req.path,
      )
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

type ViewSetRowsError {
  ViewSetRowsInvalidExerciseId
  ViewSetRowsInvalidCursor
  ViewSetRowsExerciseNotFound
  ViewSetRowsDatabaseFailure(pog.QueryError)
}

pub fn view_set_rows(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(ViewSetRowsInvalidExerciseId),
    )
    use cursor_query <- result.try(
      wisp.get_query(req)
      |> list.key_find("cursor")
      |> result.replace_error(ViewSetRowsInvalidCursor),
    )
    use cursor <- result.try(
      timestamp.parse_rfc3339(cursor_query)
      |> result.replace_error(ViewSetRowsInvalidCursor),
    )
    use cursor_id_query <- result.try(
      wisp.get_query(req)
      |> list.key_find("cursor_id")
      |> result.replace_error(ViewSetRowsInvalidCursor),
    )
    use cursor_id <- result.try(
      int.parse(cursor_id_query)
      |> result.replace_error(ViewSetRowsInvalidCursor),
    )
    use <- bool.guard(
      when: cursor_id <= 0,
      return: Error(ViewSetRowsInvalidCursor),
    )
    use selected_exercise <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewSetRowsDatabaseFailure),
    )
    use _ <- result.try({
      option.to_result(selected_exercise, ViewSetRowsExerciseNotFound)
    })

    load_sets_page(
      user,
      id,
      workout_set.After(workout_set.PageCursor(
        done_at: cursor,
        id: workout_set.SetId(cursor_id),
      )),
      0,
      ctx,
    )
    |> result.map_error(ViewSetRowsDatabaseFailure)
  }

  case result {
    Ok(sets_page) ->
      sets_page
      |> exercise_view.exercise_set_rows()
      |> element.to_string()
      |> wisp.html_response(200)
    Error(ViewSetRowsInvalidExerciseId) ->
      exercise_view.exercise_set_rows_error("invalid exercise id")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewSetRowsInvalidCursor) ->
      exercise_view.exercise_set_rows_error("invalid cursor")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewSetRowsExerciseNotFound) ->
      exercise_view.exercise_set_rows_error("exercise not found")
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewSetRowsDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.exercise_set_rows_error("something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

fn load_sets_page(
  user: User,
  exercise_id: ExerciseId,
  position: workout_set.PagePosition,
  total_count: Int,
  ctx: Ctx,
) {
  use fetched_rows <- result.try(
    workout_set_repo.select_page_by_exercise_id_and_user_id(
      ctx.db,
      exercise_id,
      user.id,
      position,
      sets_page_size + 1,
    ),
  )

  let has_next_page = list.length(fetched_rows) > sets_page_size
  let rows = list.take(fetched_rows, sets_page_size)

  let next_cursor = case has_next_page, list.last(rows) {
    True, Ok(last_set) ->
      option.Some(workout_set.PageCursor(
        done_at: last_set.done_at,
        id: last_set.id,
      ))
    _, _ -> option.None
  }

  Ok(exercise_view.SetsPage(
    exercise_id:,
    rows:,
    total_count:,
    next_cursor:,
    weight_unit: user.weight_unit,
    one_rep_max_algorithm: user.one_rep_max_algorithm,
  ))
}

type ViewRenamePageError {
  ViewRenamePageInvalidId
  ViewRenamePageNotFound
  ViewRenamePageDatabaseFailure(pog.QueryError)
}

pub fn view_rename_page(
  req: Request,
  user: User,
  ctx: Ctx,
  exercise_id: String,
) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(ViewRenamePageInvalidId),
    )
    use selected_exercise_option <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewRenamePageDatabaseFailure),
    )

    option.to_result(selected_exercise_option, ViewRenamePageNotFound)
  }

  case result {
    Ok(selected_exercise) ->
      exercise_schema.rename()
      |> form.add_values([#("name", selected_exercise.name.value)])
      |> exercise_view.rename_form(selected_exercise.id)
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(ViewRenamePageInvalidId) ->
      exercise_view.rename_error("invalid exercise id")
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewRenamePageNotFound) ->
      exercise_view.rename_error("exercise not found")
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewRenamePageDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.rename_error("something went wrong")
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type RenameError {
  RenameValidation(Form(RenameExerciseSchema))
  RenameNotFound
  RenameDatabaseFailure(pog.QueryError)
}

pub fn rename(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  use formdata <- wisp.require_form(req)

  use id <- web.require_ok(
    parse_exercise_id(exercise_id)
    |> result.replace_error(
      exercise_view.rename_error("invalid exercise id")
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(422),
    ),
  )

  let result = {
    use input <- result.try(
      exercise_schema.rename()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(RenameValidation),
    )

    exercise_repo.update_name_by_id_and_user_id(ctx.db, id, user.id, input.name)
    |> result.map_error(RenameDatabaseFailure)
    |> result.try(option.to_result(_, RenameNotFound))
  }

  case result {
    Ok(id) ->
      wisp.ok()
      |> wisp.set_header(
        "HX-Redirect",
        "/exercises/" <> int.to_string(id.value),
      )
    Error(RenameValidation(form)) ->
      form
      |> form.add_values(formdata.values)
      |> exercise_view.rename_form(id)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(RenameNotFound) ->
      exercise_view.rename_error("exercise not found")
      |> exercise_view.rename_page(req.path)
      |> element.to_string()
      |> wisp.html_response(404)
    Error(RenameDatabaseFailure(pog.ConstraintViolated(
      _,
      "exercises_user_id_name_key",
      _,
    ))) ->
      exercise_schema.rename()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Exercise name is already used."),
      )
      |> exercise_view.rename_form(id)
      |> element.to_string()
      |> wisp.html_response(409)
    Error(RenameDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_schema.rename()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> exercise_view.rename_form(id)
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
) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(ViewRemovePageInvalidId),
    )
    use selected_exercise_option <- result.try(
      exercise_repo.select_by_id_and_user_id(ctx.db, id, user.id)
      |> result.map_error(ViewRemovePageDatabaseFailure),
    )

    option.to_result(selected_exercise_option, ViewRemovePageNotFound)
  }

  case result {
    Ok(selected_exercise) ->
      exercise_view.remove_form(selected_exercise)
      |> exercise_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(200)
    Error(ViewRemovePageInvalidId) ->
      exercise_view.remove_error("invalid exercise id")
      |> exercise_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(422)
    Error(ViewRemovePageNotFound) ->
      exercise_view.remove_error("exercise not found")
      |> exercise_view.remove_page(req.path)
      |> element.to_string()
      |> wisp.html_response(404)
    Error(ViewRemovePageDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.remove_error("something went wrong")
      |> exercise_view.remove_page(req.path)
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

pub fn remove(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id) |> result.replace_error(RemoveInvalidId),
    )

    exercise_repo.delete_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(RemoveDatabaseFailure)
    |> result.try(option.to_result(_, RemoveNotFound))
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) -> wisp.ok() |> wisp.set_header("HX-Redirect", "/exercises")
    Error(RemoveInvalidId) ->
      exercise_view.remove_error("invalid exercise id")
      |> element.to_string()
      |> wisp.html_response(422)
    Error(RemoveNotFound) ->
      exercise_view.remove_error("exercise not found")
      |> element.to_string()
      |> wisp.html_response(404)
    Error(RemoveDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.remove_error("something went wrong")
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type UpdateTagsError {
  UpdateTagsInvalidId
  UpdateTagsValidation(Form(UpdateExerciseTagsSchema))
  UpdateTagsDatabaseFailure(pog.QueryError)
}

pub fn update_tags(req: Request, user: User, ctx: Ctx, exercise_id: String) {
  use formdata <- wisp.require_form(req)

  let result = {
    use id <- result.try(
      parse_exercise_id(exercise_id)
      |> result.replace_error(UpdateTagsInvalidId),
    )
    use input <- result.try(
      exercise_schema.update_tags()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(UpdateTagsValidation),
    )

    use new_tags <- result.try(
      exercise_repo.replace_tags_by_id_and_user_id(
        ctx.db,
        id,
        user.id,
        input.tag_ids,
      )
      |> result.map_error(fn(error) {
        case error {
          pog.TransactionQueryError(error) -> UpdateTagsDatabaseFailure(error)
          pog.TransactionRolledBack(error) -> UpdateTagsDatabaseFailure(error)
        }
      }),
    )

    use all_tags <- result.try(
      tag_repo.select_all_by_user_id(ctx.db, user.id)
      |> result.map_error(UpdateTagsDatabaseFailure),
    )

    Ok(#(id, all_tags, list.map(new_tags, fn(tag) { tag.value })))
  }

  case result {
    Ok(#(id, all_tags, selected_tag_ids)) -> {
      exercise_view.exercise_tags_form(id, all_tags, selected_tag_ids)
      |> element.to_string()
      |> wisp.html_response(200)
    }
    Error(UpdateTagsInvalidId) | Error(UpdateTagsValidation(_)) -> {
      exercise_view.exercise_tags_error("Invalid tag id")
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(UpdateTagsDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      exercise_view.exercise_tags_error("Something went wrong")
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
